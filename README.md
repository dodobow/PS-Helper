# 🌳🦖 PS 길라잡이 (PS Helper) 🦕🌴

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Chrome](https://img.shields.io/badge/Chrome_Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)

> **Solved.ac 데이터를 활용하여 나에게 딱 맞는 알고리즘 문제를 추천해주는 크롬 확장 프로그램입니다.**
>
> 사용자의 티어와 목표(취업, 대회 등)를 분석하여 최적의 난이도를 산출하고 문제를 추천해줍니다.

<br/>

## ✨ 주요 기능 (Key Features)

- **🧩 맞춤형 문제 추천**
  - 사용자의 Solved.ac 티어를 기반으로 적절한 난이도의 문제를 추천합니다.
  - 알고리즘 공부 목적(입문, 취업, 대회)에 따라 추천 범위를 자동으로 보정합니다.

- **📊 섬세한 난이도 조절**
  - "조금 더 쉽게" 혹은 "조금 더 어렵게" 옵션을 통해, 추천 범위를 미세 조정할 수 있습니다.
  - 옵션 변경 시 추천되는 티어 범위를 실시간으로 확인 할 수 있습니다.

- **🔗 Solved.ac 연동**
  - 백준 핸들(ID)을 입력하면 실시간으로 티어 정보를 불러옵니다.
  - 나의 현재 티어와 레이팅 정보를 시각적으로 확인할 수 있습니다.

<br/>

## 📸 스크린샷 (Screenshots)

| **팝업 메인 (Popup)** | **설정 페이지 (Options)** |
|:---:|:---:|
| <img src="./assets/preview_popup.JPG" width="300"> | <img src="./assets/preview_option.JPG" width="600"> |
| 내 티어 확인 및 문제 뽑기 | 목표 설정 및 난이도 조절 |

<br/>

## 🚀 설치 및 실행 방법 (Installation)

이 프로젝트는 현재 크롬 웹 스토어에 등록되지 않았으며, **개발자 모드**를 통해 설치할 수 있습니다.

1. 이 저장소를 다운로드하거나 클론(Clone)합니다.
2. 크롬 브라우저 주소창에 `chrome://extensions/`를 입력하여 이동합니다.
3. 우측 상단의 **'개발자 모드(Developer mode)'** 스위치를 켭니다.
4. 좌측 상단의 **'압축 해제된 확장 프로그램을 로드합니다(Load unpacked)'** 버튼을 클릭합니다.
5. 다운로드 받은 프로젝트 폴더(`PS-Helper`)를 선택합니다.

<br/>

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **API:** [Solved.ac API](https://solvedac.github.io/unofficial-documentation/)
- **Platform:** Chrome Extension Manifest V3

<br/>

## 📝 License

This project is licensed under the MIT License.
