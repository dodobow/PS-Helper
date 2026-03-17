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
        
        titleMsg.innerHTML = `✈️
        <span style="color: ${userTierInfo.color}; font-weight: bold;">${userId}</span>
        님의 목표는 무엇인가요?`;

        const goalKey = `goal_${userId}`;
        const diffKey = `diff_${userId}`;
        const modeKey = `mode_${userId}`;

        chrome.storage.local.get([goalKey, diffKey, modeKey], (result) => {
            const savedGoal = result[goalKey];
            if (savedGoal) {
                const targetCard = document.querySelector(`.goal-card[data-value="${savedGoal}"]`);
                if (targetCard) {
                    targetCard.classList.add('selected');
                    updateStatusMessage(savedGoal);
                }
            }

            const targetValue = result[diffKey] ? result[diffKey] : '0';
            diffCards.forEach(c => c.classList.remove('selected'));
            const targetCard = document.querySelector(`.diff-card[data-value="${targetValue}"]`);
            if (targetCard) targetCard.classList.add('selected');

            if (result[modeKey]) {
                isCustomMode = true;
                const toggleContainer = document.getElementById('tag-toggle');
                if (toggleContainer) {
                    toggleContainer.classList.add('custom-mode');
                }
            }
            updateRecommendRange(userId);
            setupToggle(userId);
            loadAnalysis(userId);
            calcInnerRating();
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
                loadAnalysis(userId);
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

const GOAL_TAGS = {
    'default': [
        { key : ['#dp'], name : '다이나믹&nbsp;프로그래밍' },
        { key : ['#implementation'], name : '구현' },
        { key : ['#graphs'], name : '그래프&nbsp;이론' },
        { key : ['#greedy'], name : '그리디&nbsp;알고리즘' },
        { key : ['#data_structures'], name : '자료&nbsp;구조' },
        { key : ['#string'], name : '문자열' },
        { key : ['#math'], name : '수학' },
        { key : ['#geometry'], name : '기하학' }
    ],
    'beginner': [
        {key : ['#implementation', '#simulation'], name : '구현'},
        {key : ['#bruteforcing'], name : '브루트포스&nbsp;알고리즘'},
        {key : ['#binary_search'], name : '이분&nbsp;탐색'},
        {key : ['#math', '#arithmetic'], name : '수학'},
        {key : ['#stack', '#queue', '#deque'], name : '선형&nbsp;자료구조'},
        {key : ['#string'], name : '문자열'},
        {key : ['#sorting'], name : '정렬'},
        {key : ['#ad_hoc'], name : '애드&nbsp;혹'},
        {key : ['#recursion', '#set'], name : '재귀&nbsp;함수와&nbsp;집합과&nbsp;맵'},
        {key : ['#dp', '#greedy'], name : '기초 알고리즘'}
    ],
    'job': [
        {key : ['#dp', '#knapsack', '#dp_tree'], name : '다이나믹&nbsp;프로그래밍'},
        {key : ['#greedy'], name : '그리디&nbsp;알고리즘'},
        {key : ['#graphs', '#shortest_path', '#bfs', '#dfs'], name : '그래프와&nbsp;최단&nbsp;거리'},
        {key : ['#priority_queue', '#disjoint_set', '#stack', '#queue', '#set', '#deque'], name : '다양한&nbsp;자료구조'},
        {key : ['#binary_search', '#parametric_search'], name : '이분&nbsp;탐색과&nbsp;응용'},
        {key : ['#backtracking', '#bruteforcing'], name : '완전&nbsp;탐색'},
        {key : ['#simulation', '#implementation', '#case_work'], name : '구현&nbsp;능력'},
        {key : ['#string'], name : '문자열'},
        {key : ['#prefix_sum'], name : '누적&nbsp;합'},
        {key : ['#two_pointer', '#sliding_window', '#sweeping'], name : '다양한&nbsp;테크닉'}
    ],
    'contest': [
        {key : ['#segtree', '#lazyprop', '#pst', '#merge_sort_tree'], name : '세그먼트&nbsp;트리와&nbsp;응용'},
        {key : ['#string', '#kmp', '#trie', '#suffix_array'], name : '문자열'},
        {key : ['#number_theory', '#probability', '#combinatorics'], name : '정수론과&nbsp;조합론,&nbsp;확률론'},
        {key : ['#ad_hoc'], name : '애드&nbsp;혹'},
        {key : ['#greedy'], name : '그리디&nbsp;알고리즘'},
        {key : ['#dp', '#dp_tree', '#dp_digit', '#dp_bitfield', '#tsp', '#cht'], name : '다이나믹&nbsp;프로그래밍'},
        {key : ['#graphs', '#trees', '#flow', '#mcmf', '#mfmc', '#scc', '#2_sat', '#bipartite_matching', '#lca', '#centroid'], name : '그래프와&nbsp;트리'},
        {key : ['#geometry', '#convex_hull', '#line_intersection', '#rotating_calipers', '#polygon_area'], name : '기하학'},
        {key : ['#mo', '#offline_queries', '#sqrt_decomposition', '#smaller_to_larger', '#coordinate_compression'], name : '쿼리와&nbsp;최적화'},
        {key : ['#bitmask', '#mitm', '#sweeping', '#permutation_cycle_decomposition', '#game_theory', '#sprague_grundy', '#euler_tour_technique'], name : '다양한&nbsp;테크닉'}
    ]
}

const TAG_TRANSLATE = {
    'dp' : '다이나믹 프로그래밍',
    'implementation' : '구현',
    'greedy' : '그리디 알고리즘',
    'data_structures' : '자료 구조',
    'string' : '문자열',
    'math' : '수학',
    'geometry' : '기하학',
    'simulation' : '시뮬레이션',
    'bruteforcing' : '브루트포스 알고리즘',
    'binary_search' : '이분 탐색',
    'arithmetic' : '사칙연산',
    'stack' : '스택',
    'queue' : '큐',
    'deque' : '덱',
    'sorting' : '정렬',
    'recursion' : '재귀',
    'set' : '집합과 맵',
    'knapsack' : '배낭 문제',
    'shortest_path' : '최단 경로',
    'bfs' : '너비 우선 탐색',
    'dfs' : '깊이 우선 탐색',
    'priority_queue' : '우선순위 큐',
    'disjoint_set' : '분리 집합',
    'parametric_search' : '매개 변수 탐색',
    'backtracking' : '백트래킹',
    'case_work' : '많은 조건 분기',
    'prefix_sum' : '누적 합',
    'sliding_window' : '슬라이딩 윈도우',
    'sweeping' : '스위핑',
    'segtree' : '세그먼트 트리',
    'lazyprop' : '느리게 갱신되는 세그먼트 트리',
    'pst' : '퍼시스턴트 세그먼트 트리',
    'merge_sort_tree' : '머지 소트 트리',
    'kmp' : 'KMP',
    'trie' : '트라이',
    'number_theory' : '정수론',
    'probability' : '확률론',
    'combinatorics' : '조합론',
    'tsp' : '외판원 순회 문제',
    'cht' : '볼록 껍질을 이용한 최적화',
    'flow' : '최대 유량',
    'mcmf' : '최소 비용 최대 유량',
    'mfmc' : '최대 유량 최소 컷 정리',
    'scc' : '강한 연결 요소',
    'bipartite_matching' : '이분 매칭',
    'lca' : '최소 공통 조상',
    'convex_hull' : '볼록 껍질',
    'rotating_calipers' : '회전하는 캘리퍼스',
    'offline_queries' : '오프라인 쿼리',
    'sqrt_decomposition' : '제곱근 분할법',
    'smaller_to_larger' : '작은 집합에서 큰 집합으로 합치는 테크닉',
    'bitmask' : '비트마스킹',
    'permutation_cycle_decomposition' : '순열 사이클 분할',
    'game_theory' : '게임 이론',
    'euler_tour_technique' : '오일러 경로 테크닉',

    'dp_tree' : '트리에서의 DP',
    'two_pointer' : '투 포인터',
    'coordinate_compression' : '값 / 좌표 압축',
    'dp_digit' : '자릿수를 이용한 DP',
    'line_intersection' : '선분 교차 판정',
    'mo' : 'mo\'s',
    'graphs' : '그래프 이론',
    'mitm' : '중간에서 만나기',
    '2_sat' : '2-sat',
    'trees' : '트리',
    'ad_hoc' : '애드 혹',
    'sprague_grundy' : '스프라그 그런디 정리',
    'suffix_array' : '접미사 배열과 LCP 배열',
    'dp_bitfield' : '비트필드를 이용한 DP',
    'polygon_area' : '다각형의 넓이',
    'centroid' : '센트로이드'
}

let isCustomMode = false;

function setupToggle(userId) {
    const toggleContainer = document.getElementById('tag-toggle');
    if (!toggleContainer) return;
    
    const modeKey = `mode_${userId}`;
    
    toggleContainer.addEventListener('click', () => {
        isCustomMode = !isCustomMode
        toggleContainer.classList.toggle('custom-mode');
        chrome.storage.local.set({[modeKey] : isCustomMode}, () => {
            loadAnalysis(userId);
        });
    });
}

async function loadAnalysis(userId) {
    const spinner = document.getElementById('loading-spinner');
    const resultBox = document.getElementById('analysis-result');
    const gridStrong = document.getElementById('grid-strong');
    const gridNormal = document.getElementById('grid-normal');
    const gridWeak = document.getElementById('grid-weak');
    const commentBox = document.getElementById('analysis-comment');
    
    spinner.style.display = 'block';
    resultBox.style.display = 'none';

    if (!userId) {
        spinner.innerHTML = '<p>⚠️ 팝업에서 백준 계정을 먼저 연동해주세요!</p>';
        return;
    }

    chrome.storage.local.get([`goal_${userId}`, 'solvedTier'], async (res) => {
        try {
            const TARGET_TAGS = res[`goal_${userId}`] && isCustomMode ? GOAL_TAGS[res[`goal_${userId}`]] : GOAL_TAGS['default'];
            const results = await Promise.all(TARGET_TAGS.map(async (tag) => {
                const queryString = `s@${userId} (${tag.key.join(' | ')})`;
                const url = `https://solved.ac/api/v3/search/problem?query=${encodeURIComponent(queryString)}&sort=level&direction=desc`
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`API 통신 실패 (${tag.name}): ${response.status}`);
                }

                const data = await response.json();
                let rating = 0;
                data.items.forEach(problem => {rating += problem.level;})
                rating = rating * 2 + Math.round(200 * (1 - Math.pow(0.99, data.count)));
                return {
                    'name' : tag.name,
                    'rating' : rating,
                    'tierInfo' : calculateTierInfo(calculateRatingToTier(rating)),
                    'keys': tag.key
                };
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
                
                let korTags = [];
                data.keys.forEach((engTag) => {
                    korTags.push(`<span class="tag-badge">#${TAG_TRANSLATE[engTag.slice(1)]}</span>`);
                })
                console.log(korTags);
                const hashTags = korTags.join('<br>');
                
                tagCard.innerHTML = `
                <span class="tag-name">${data.name}</span>
                <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 5px;">
                    <img src="${data.tierInfo.badgeUrl}" alt="${data.tierInfo.name}" style="height: 20px; transform: translateY(1px);">
                    <span class="tag-tier" style="color: ${data.tierInfo.color}; display: inline-block; line-height: 1;">
                        ${data.rating}
                    </span>
                </div>

                <div class="tag-tooltip">
                    <span class="tooltip-tags">${hashTags}</span>
                </div>
                `;
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
                    innerStabiltyComment = '상위 200문제가 <b>매우 균형</b>잡혀 있어요! 내실이 <b>완벽하게 다져진</b> 상태입니다.';
                } else if (innerStabilty >= 90) {
                    innerStabiltyComment = '상위 200문제가 <b>좋은 균형</b>을 이루고 있어요. 내실이 <b>잘 다져진</b> 상태입니다.';
                } else if (innerStabilty >= 85) {
                    innerStabiltyComment = '상위 200문제가 <b>적당한 균형</b>을 이루고 있어요. 내실이 <b>무난하게 다져진</b> 상태입니다.';
                } else if (innerStabilty >= 80) {
                    innerStabiltyComment = '상위 200문제가 <b>조금 불균형</b>해요. 내실이 <b>살짝 부족한</b> 상태입니다.';
                } else {
                    innerStabiltyComment = '상위 200문제가 <b>아주 불균형</b>해요. 내실이 <b>매우 부족한</b> 상태입니다.';
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