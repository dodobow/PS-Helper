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
            console.log(res);
            const userTier = res.solvedTier;
            const userGoal = res[goalKey];
            const userDiff = parseInt(res[diffKey] ? res[diffKey] : '0');
            const rangeSpan = document.getElementById('expected-tier-display');

            if (userTier === undefined) {
                rangeSpan.textContent = '팝업에서 계정 연동을 먼저 진행해주세요!';
                return;
            }

            if (!userGoal) {
                rangeSpan.textContent = '목표를 먼저 선택해주세요! 🎯';
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
        titleMsg.innerHTML = `🎯
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

document.getElementById('refresh-analysis-btn').addEventListener('click', loadAnalysis);

async function loadAnalysis() {
    const spinner = document.getElementById('loading-spinner');
    const resultBox = document.getElementById('analysis-result');
    const tagGrid = document.getElementById('tag-grid');
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
            console.log(`[분석 시작] ${userId} 님의 데이터를 가져옵니다...`);
            
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
            
            const totalRating = results.reduce((sum, data) => sum + data.rating, 0);
            const avgRating = totalRating / 8;
            let strongTags = [], weakTags = [];
            tagGrid.innerHTML = '';
            
            results.forEach(data => {
                const tagCard = document.createElement('div');
                const relativeTagRating = avgRating === 0 ? 0 : (data.rating - avgRating) / avgRating * 100;
                
                tagCard.className = 'tag-card';
                if (relativeTagRating < -10) {
                    tagCard.classList.add('weak');
                    weakTags.push(data.name);
                }
                else if (relativeTagRating > 10) {
                    tagCard.classList.add('strong');
                    strongTags.push(data.name);
                }
                else {
                    tagCard.classList.add('normal');
                }
                tagCard.innerHTML = `
                <span class="tag-name">${data.name}</span>
                <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 5px;">
                    <img src="${data.tierInfo.badgeUrl}" alt="${data.tierInfo.name}" style="height: 20px; transform: translateY(1px);">
                    <span class="tag-tier" style="color: ${data.tierInfo.color}; display: inline-block; font-size: 17px; line-height: 1;">
                        ${data.rating}
                    </span>
                </div>`;
                tagGrid.appendChild(tagCard);
            })

            let summaryText = '';
            if (weakTags.length > 0 && strongTags.length > 0) {
                summaryText = `🔥 <b>${weakTags.join(', ')}</b> 보완이 필요하지만, 💪 <b>${strongTags.join(', ')}</b> 분야는 훌륭해요!`;
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
            console.log("UI 렌더링 완료!");

        } catch (error) {
            console.error("분석 중 에러 발생:", error);
            spinner.innerHTML = '<p>❌ 데이터를 분석하는 중 오류가 발생했습니다.</p>';
        }
    });
}