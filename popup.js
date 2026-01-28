const TIER_COLORS = [
    '#000000',
    '#ad5600', '#b85b00', '#c46100', '#cf6700', '#db6c00',
    '#435f7a', '#476582', '#4b6b8a', '#507292', '#54789a',
    '#ec9a00', '#fba400', '#ffae00', '#ffb800', '#ffc300',
    '#25d69b', '#27e2a4', '#28edac', '#2af8b4', '#2cffbc',
    '#00b4fc', '#00c0ff', '#00ccff', '#00d8ff', '#00e4ff',
    '#cc004e', '#dd0054', '#ee005b', '#ff0062', '#ff0068',
    '#AC9FFF'
];

let cachedUserData = null;

document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginBtn');
    const inputField = document.getElementById('solvedId');
    const resultDiv = document.getElementById('result');
    const recommendButton = document.getElementById('recommendBtn');
    const settingButton = document.getElementById('settingBtn');

    loginButton.addEventListener('click', () => handleSearch(inputField, resultDiv));

    inputField.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') handleSearch(inputField, resultDiv);
    });

    recommendButton.addEventListener('click', () => recommendProblem(cachedUserData.tier));
    
    inputField.focus();

    chrome.storage.local.get(['solvedId'], (result) => {
        if (result.solvedId) {
            inputField.value = result.solvedId;
            handleSearch(inputField, resultDiv);
        }
    });

    if (settingButton) {
        settingButton.addEventListener('click', () => {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL('options.html'));
            }
        });
    }
});

async function handleSearch(inputField, resultDiv) {
    const userId = inputField.value;
        if (!userId) {
            alert('ID를 입력해주세요.');
            inputField.focus();
            return;
        }
        try {
            const data = await fetchSolvedData(userId);
            cachedUserData = data;
            chrome.storage.local.set({solvedId : userId});
            
            const tierInfo = calculateTierInfo(data.tier);
            updateResultUI(resultDiv, data, tierInfo);

            const recommendSection = document.getElementById('recommend-section');
            if (recommendSection) {
                recommendSection.style.display = 'block';
            }
        } catch (error) {
            resultDiv.innerHTML = `<span style="color: red;">${error.message}</span>`;
            document.getElementById('recommend-section').style.display = 'none';
        }
}

async function fetchSolvedData(userId) {
    const url = `https://solved.ac/api/v3/user/show?handle=${userId}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('유저 정보를 가져올 수 없습니다.');
    }
    return await response.json();
}

function calculateTierInfo(tierNum) {
    let name = ''
    if (tierNum == 0) {
        name = 'Unrated';
    } else if (tierNum == 31) {
        name = 'Master';
    } else {
        name = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ruby'][Math.floor((tierNum - 1) / 5)] + ' ' + ['V', 'IV', 'III', 'II', 'I'][(tierNum + 4) % 5];
    }
    return {name, color : TIER_COLORS[tierNum]};
}

function updateResultUI(targetDiv, userData, tierInfo) {
    targetDiv.innerHTML = `
    <div>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${userData.handle}</div>
        <div style="font-size: 14px; color: #666;">
            레이팅 : <span style="color: ${tierInfo.color}; font-weight: bold;">${userData.rating}</span>
        </div>
        <div style="font-size: 14px; color: #666;">
            티어 : <span style="color: ${tierInfo.color}; font-weight: bold;">${tierInfo.name}</span>
        </div>
    </div>
    `;
}

async function recommendProblem(userTier) {
    const problemDiv = document.getElementById('problem-view');
    problemDiv.innerHTML = '문제 찾는 중...';

    try {
        const queryString = '*' + Math.max(userTier - 10, 1) + '..' + Math.max(userTier - 4, 3) + ' !@$me %ko s#100..';
        const url = `https://solved.ac/api/v3/search/problem?query=${encodeURIComponent(queryString)}&sort=random`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('문제 정보를 가져올 수 없습니다.');
        }
        const data = await response.json();
        console.log(data);

        if (data.count === 0) {
            problemDiv.innerHTML = '추천할 문제가 다 떨어졌어요 😭';
            return;
        }
        const recommendedProblem = data.items[0];
        problemDiv.innerHTML = `
            <a href="https://www.acmicpc.net/problem/${recommendedProblem.problemId}" target="_blank" class="problem-link">
                <span style="font-weight:bold; color:#0078FF;">${recommendedProblem.problemId}번</span>
                <span>${recommendedProblem.titleKo}</span>
            </a>
        `;
    } catch (error) {
        problemDiv.innerHTML = `<span style="color: red;">${error.message}</span>`;
    }
}