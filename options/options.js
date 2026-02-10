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