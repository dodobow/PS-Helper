document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.goal-card');
    const statusMsg = document.getElementById('status-msg');
    const diffCards = document.querySelectorAll('.diff-card');
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

    chrome.storage.local.get(['solvedId'], (res) => {
        const userId = res.solvedId;
        if (!userId) {
            alert('우선 백준 계정을 연동해주세요.');
            window.close();
            return;
        }

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

        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const selectedGoal = card.getAttribute('data-value');
                chrome.storage.local.set({[goalKey] : selectedGoal}, () => {
                    updateStatusMessage(selectedGoal);
                });
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
            });
        });
    });
});