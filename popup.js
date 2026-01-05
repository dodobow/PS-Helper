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

document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('button');
    const inputField = document.getElementById('solvedId');
    const resultDiv = document.getElementById('result');

    button.addEventListener('click', async () => {
        const userId = inputField.value;
        if (!userId) {
            alert('ID를 입력해주세요.');
            return;
        }
        const url = `https://solved.ac/api/v3/user/show?handle=${userId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('유저 정보를 가져올 수 없습니다.');
            }
            const data = await response.json();
            console.log(data);
            
            let tierName = "Unrated";
            if (0 < data.tier && data.tier < 31) {
                tierName = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ruby'][Math.floor((data.tier - 1) / 5)] + ' ' + ['V', 'IV', 'III', 'II', 'I'][(data.tier + 4) % 5];
            }
            else if (data.tier == 31) {
                tierName = 'Master';
            }
            const tierColor = TIER_COLORS[data.tier];
            resultDiv.innerHTML = `
            ${data.handle}<br>
            레이팅 : <span style="color: ${tierColor}">${data.rating}</span><br>
            티어 : <span style="color: ${tierColor}">${tierName}</span>
            `
        } catch (error) {
            alert('오류가 발생했습니다. ' + error.message);
        }
    });
});