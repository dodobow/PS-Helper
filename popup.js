document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('button');
    const inputField = document.getElementById('solvedId');

    button.addEventListener('click', async () => {
        const userId = inputField.value;
        if (!userId) {
            alert('ID를 입력해주세요.');
            return
        }
        const url = `https://solved.ac/api/v3/user/show?handle=${userId}`
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('유저 정보를 가져올 수 없습니다.');
            }
            const data = await response.json();
            console.dir(data);
            console.log(data);
            alert(`연동에 성공했습니다. ${data.handle}님의 티어 점수는 ${data.tier}점, 레이팅은 ${data.rating}점입니다.`);
        } catch (error) {
            alert('오류가 발생했습니다. ' + error.message);
        }
    });
});