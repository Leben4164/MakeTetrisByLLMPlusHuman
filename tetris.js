const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const nextCanvas = document.getElementById('next-block');
const nextContext = nextCanvas.getContext('2d');

// 블록 하나를 30x30 픽셀 크기로 설정
// tetris canvas(300x600) -> 10칸 x 20칸
context.scale(30, 30);
// next-block canvas(120x120) -> 4칸 x 4칸
nextContext.scale(30, 30);

// 초기화 확인 메시지
console.log("Catppuccin Tetris UI 세팅 완료!");