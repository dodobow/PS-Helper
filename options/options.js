document.addEventListener('DOMContentLoaded', () => {
    const goalCards = document.querySelectorAll('.goal-card');
    const statusMsg = document.getElementById('status-msg');
    const diffCards = document.querySelectorAll('.diff-card');
    const titleMsg = document.getElementById('dashboard-title');
    const goalMsg = {
        'beginner' : '코딩 입문을 위해서는 간단한 브론즈, 실버 문제를 풀며 문법에 익숙해지는 과정이 중요해요!',
        'job' : '코딩테스트의 안정적인 합격을 위해서는 어려운 실버 문제와 골드 문제들을 푸는 연습이 필요해요!',
        'contest' : '대규모 대회 수상이 목적이라면, 골드는 물론이고 플레티넘 문제들도 풀 수 있어야 해요!'
    };
    
    function updateStatusMessage(goal) {
        if (goalMsg[goal]) {
            statusMsg.textContent = goalMsg[goal];
        }
    }

    function updateRecommendRange(userId) {
        const goalKey = `goal_${userId}`;
        const diffKey = `diff_${userId}`;
        chrome.storage.local.get(['solvedTier', goalKey, diffKey], (res) => {
            const userTier = res.solvedTier;
            const userGoal = res[goalKey];
            const userDiff = parseInt(res[diffKey] ? res[diffKey] : '0');
            const rangeSpan = document.getElementById('expected-tier-display');

            if (userTier === undefined) {
                rangeSpan.textContent = '팝업에서 계정 연동을 먼저 진행해주세요!';
                return;
            }

            if (!userGoal) {
                rangeSpan.textContent = '목표를 먼저 선택해주세요!';
                return;
            }

            const recommendRange = calculateRecommendTier(userTier, userGoal, userDiff);
            const loInfo = calculateTierInfo(recommendRange.lo);
            const hiInfo = calculateTierInfo(recommendRange.hi);
            rangeSpan.innerHTML = `
            <span style="color: ${loInfo.color}; font-weight: bold;">${loInfo.name}</span>
            <span> ~ </span>
            <span style="color: ${hiInfo.color}; font-weight: bold;">${hiInfo.name}</span>`;
        })
    }

    chrome.storage.local.get(['solvedId', 'solvedTier'], (res) => {
        const userId = res.solvedId;
        const userTier = res.solvedTier;
        const userTierInfo = calculateTierInfo(userTier);
        
        if (!userId) {
            alert('우선 백준 계정을 연동해주세요.');
            window.close();
            return;
        }

        updateRecommendRange(userId);
        loadAnalysis();
        calcInnerRating();
        titleMsg.innerHTML = `✈️
        <span style="color: ${userTierInfo.color}; font-weight: bold;">${userId}</span>
        님의 목표는 무엇인가요?`;

        const goalKey = `goal_${userId}`;
        chrome.storage.local.get([goalKey], (result) => {
            const savedGoal = result[goalKey];
            if (savedGoal) {
                const targetCard = document.querySelector(`.goal-card[data-value="${savedGoal}"]`);
                if (targetCard) {
                    targetCard.classList.add('selected');
                    updateStatusMessage(savedGoal);
                }
            }
        });
        
        const diffKey = `diff_${userId}`;
        chrome.storage.local.get([diffKey], (result) => {
            const targetValue = result[diffKey] ? result[diffKey] : '0';
            diffCards.forEach(c => c.classList.remove('selected'));
            const targetCard = document.querySelector(`.diff-card[data-value="${targetValue}"]`);
            if (targetCard) targetCard.classList.add('selected');
        });

        goalCards.forEach(card => {
            card.addEventListener('click', () => {
                goalCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const selectedGoal = card.getAttribute('data-value');
                chrome.storage.local.set({[goalKey] : selectedGoal}, () => {
                    updateStatusMessage(selectedGoal);
                });
                updateRecommendRange(userId);
            });
        });

        diffCards.forEach(card => {
            card.addEventListener('click', () => {
                diffCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const selectedDiff = card.getAttribute('data-value');
                chrome.storage.local.set({[diffKey] : selectedDiff}, () => {
                    updateStatusMessage(selectedDiff);
                });
                updateRecommendRange(userId);
            });
        });
    });
});

const TARGET_TAGS = [
    { key: 'dp', name: '다이나믹 프로그래밍' },
    { key: 'implementation', name: '구현' },
    { key: 'graphs', name: '그래프 이론' },
    { key: 'greedy', name: '그리디 알고리즘' },
    { key: 'data_structures', name: '자료 구조' },
    { key: 'string', name: '문자열' },
    { key: 'math', name: '수학' },
    { key: 'geometry', name: '기하학' }
];

async function loadAnalysis() {
    const spinner = document.getElementById('loading-spinner');
    const resultBox = document.getElementById('analysis-result');
    const gridStrong = document.getElementById('grid-strong');
    const gridNormal = document.getElementById('grid-normal');
    const gridWeak = document.getElementById('grid-weak');
    const commentBox = document.getElementById('analysis-comment');
    
    spinner.style.display = 'block';
    resultBox.style.display = 'none';

    chrome.storage.local.get(['solvedId', 'solvedTier'], async (res) => {
        const userId = res.solvedId;

        if (!userId) {
            spinner.innerHTML = '<p>⚠️ 팝업에서 백준 계정을 먼저 연동해주세요!</p>';
            return;
        }

        try {
            const results = await Promise.all(TARGET_TAGS.map(async (tag) => {
                const queryString = `s@${userId} #${tag.key}`;
                const url = `https://solved.ac/api/v3/search/problem?query=${encodeURIComponent(queryString)}&sort=level&direction=desc`
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`API 통신 실패 (${tag.name}): ${response.status}`);
                }

                const data = await response.json();
                let rating = 0;
                data.items.forEach(problem => {rating += problem.level;})
                rating = rating * 2 + Math.round(200 * (1 - Math.pow(0.99, data.count)));
                return {'name' : tag.name, 'rating' : rating, 'tierInfo' : calculateTierInfo(calculateRatingToTier(rating))};
            }));
            results.sort((a, b) => b.rating - a.rating);

            const totalRating = results.reduce((sum, data) => sum + data.rating, 0);
            const avgRating = totalRating / TARGET_TAGS.length;
            let strongTags = [], weakTags = [];
            
            gridStrong.innerHTML = '';
            gridNormal.innerHTML = '';
            gridWeak.innerHTML = '';

            results.forEach(data => {
                const tagCard = document.createElement('div');
                const relativeTagRating = avgRating === 0 ? 0 : (data.rating - avgRating) / avgRating * 100;
                
                tagCard.className = 'tag-card';
                
                if (relativeTagRating < -10) {
                    tagCard.classList.add('weak');
                    weakTags.push(data.name);
                    gridWeak.appendChild(tagCard);
                }
                else if (relativeTagRating > 10) {
                    tagCard.classList.add('strong');
                    strongTags.push(data.name);
                    gridStrong.appendChild(tagCard);
                }
                else {
                    tagCard.classList.add('normal');
                    gridNormal.appendChild(tagCard);
                }
                
                tagCard.innerHTML = `
                <span class="tag-name">${data.name}</span>
                <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 5px;">
                    <img src="${data.tierInfo.badgeUrl}" alt="${data.tierInfo.name}" style="height: 20px; transform: translateY(1px);">
                    <span class="tag-tier" style="color: ${data.tierInfo.color}; display: inline-block; font-size: 17px; line-height: 1;">
                        ${data.rating}
                    </span>
                </div>`;
            });
            let summaryText = '';
            if (weakTags.length > 0 && strongTags.length > 0) {
                summaryText = `🔥 <b>${weakTags.join(', ')}</b> 보완이 필요하지만,<br>💪 <b>${strongTags.join(', ')}</b> 분야는 훌륭해요!`;
            } else if (weakTags.length > 0) {
                summaryText = `🔥 <b>${weakTags.join(', ')}</b> 보완이 필요해요!`;
            } else if (strongTags.length > 0) {
                summaryText = `💪 <b>${strongTags.join(', ')}</b> 분야에서 강점을 보이고 있어요!`;
            } else {
                summaryText = `⚖️ 모든 태그가 놀라울 정도로 균형 잡혀 있어요!`;
            }
            commentBox.innerHTML = summaryText;

            spinner.style.display = 'none';
            resultBox.style.display = 'block';

        } catch (error) {
            console.error("분석 중 에러 발생:", error);
            spinner.innerHTML = '<p>❌ 데이터를 분석하는 중 오류가 발생했습니다.</p>';
        }
    });
}

async function calcInnerRating() {
    const startBox = document.getElementById('inner-start-box');
    const loadingSpinner = document.getElementById('inner-loading');
    const resultBox = document.getElementById('inner-result');

    startBox.style.display = 'none';
    loadingSpinner.style.display = 'block';
    resultBox.style.display = 'none';

    chrome.storage.local.get(['solvedId', 'solvedRatingByProblemsSum', 'solvedCount'], async (res) => {
        const userId = res.solvedId;
        const ratingBy100Problem = res.solvedRatingByProblemsSum;
        const solvedCount = res.solvedCount;
        
        if (!userId) {
            loadingSpinner.innerHTML = '<p>⚠️ 팝업에서 백준 계정을 먼저 연동해주세요!</p>';
            return;
        }
        try {            
            const pageNums = [2, 3, 4];
            let ratingBySeq = [0, 0, 0];
            let easyLevel = 0;
            let hardLevel = 0;
            
            await Promise.all(pageNums.map(async (pageNum) => {
                const url = `https://solved.ac/api/v3/search/problem?query=s@${userId}&sort=level&direction=desc&page=${pageNum}`;
                const response = await fetch(url);
                
                if (!response.ok) {throw new Error(`API 통신 실패 (${pageNum}): ${response.status}`);}
                
                const data = await response.json();
                data.items.forEach(problem => {ratingBySeq[pageNum - 2] += problem.level});
                
                if (pageNum === 2 && data.items.length > 0) {hardLevel = data.items[0].level;}
                if (pageNum === 4 && data.items.length === 50) {easyLevel = data.items[data.items.length - 1].level;}
            }));
            
            const ratingBy1to50 = ratingBy100Problem - ratingBySeq[0];
            const ratingBy51to100 = ratingBySeq[0];
            const ratingBy101to150 = ratingBySeq[1];
            const ratingBy151to200 = ratingBySeq[2];

            let innerStabilty = -1;
            if (solvedCount >= 200) {
                innerStabilty = Math.round(((ratingBy101to150 + ratingBy151to200) / (ratingBy1to50 + ratingBy51to100) + ((ratingBy101to150 + ratingBy151to200) / 100) / (ratingBy51to100 / 50)) * 5000) / 100;
            }

            let innerStabiltyComment = '';
            if (innerStabilty === -1) {
                innerStabiltyComment = '아직 푼 문제수가 적어서 분석이 힘들어요!<br>지금은 내실 걱정보다 더 많은 문제를 접하는 게 더 도움이 될거예요!';
                innerStabilty = '무한한 가능성이 있어요!';
            } else {
                if (innerStabilty >= 95) {
                    innerStabiltyComment = '상위 200문제가 <b>매우 균형</b>잡혀 있어요!<br>내실이 <b>완벽하게 다져진</b> 상태입니다.';
                } else if (innerStabilty >= 90) {
                    innerStabiltyComment = '상위 200문제가 <b>좋은 균형</b>을 이루고 있어요.<br>내실이 <b>잘 다져진</b> 상태입니다.';
                } else if (innerStabilty >= 85) {
                    innerStabiltyComment = '상위 200문제가 <b>적당한 균형</b>을 이루고 있어요.<br>내실이 <b>무난하게 다져진</b> 상태입니다.';
                } else if (innerStabilty >= 80) {
                    innerStabiltyComment = '상위 200문제가 <b>조금 불균형</b>해요.<br>내실이 <b>살짝 부족한</b> 상태입니다.';
                } else {
                    innerStabiltyComment = '상위 200문제가 <b>아주 불균형</b>해요.<br>내실이 <b>매우 부족한</b> 상태입니다.';
                }
                if (innerStabilty < 95) {
                    const loInfo = calculateTierInfo(easyLevel);
                    const hiInfo = calculateTierInfo(hardLevel);
                    const innerRecommendComment = `<br>
                    <span style="color: ${loInfo.color}; font-weight: bold;">${loInfo.name}</span>
                    <span> ~ </span>
                    <span style="color: ${hiInfo.color}; font-weight: bold;">${hiInfo.name}</span>`;
                    innerStabiltyComment += innerRecommendComment + ' 범위의 문제를 더 풀면 내실 향상에 도움이 될거에요!';
                }
            }

            document.getElementById('inner-comment').innerHTML = innerStabiltyComment;
            document.getElementById('inner-rating-text').textContent = innerStabilty;

            loadingSpinner.style.display = 'none';
            resultBox.style.display = 'block';
        } catch (error) {
            console.error("내실 분석 중 에러 발생:", error);
            loadingSpinner.innerHTML = '<p>❌ 데이터를 분석하는 중 오류가 발생했습니다.</p>';
        }
    });
}