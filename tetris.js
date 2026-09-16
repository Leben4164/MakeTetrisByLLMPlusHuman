const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(30, 30);

// Catppuccin Macchiato 색상 팔레트 매핑 (1~7번 블록 색상)
const COLORS = [
  null,
  '#c6a0f6', // 1: T (Mauve)
  '#eed49f', // 2: O (Yellow)
  '#f5a97f', // 3: L (Peach)
  '#8aadf4', // 4: J (Blue)
  '#8bd5ca', // 5: I (Teal)
  '#a6da95', // 6: S (Green)
  '#ed8796'  // 7: Z (Red)
];

// 7가지 테트로미노 블록 형태 정의
function createPiece(type) {
  if (type === 'T') {
    return [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ];
  } else if (type === 'O') {
    return [
      [2, 2],
      [2, 2],
    ];
  } else if (type === 'L') {
    return [
      [0, 0, 3],
      [3, 3, 3],
      [0, 0, 0],
    ];
  } else if (type === 'J') {
    return [
      [4, 0, 0],
      [4, 4, 4],
      [0, 0, 0],
    ];
  } else if (type === 'I') {
    return [
      [0, 0, 0, 0],
      [5, 5, 5, 5],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
  } else if (type === 'S') {
    return [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0],
    ];
  } else if (type === 'Z') {
    return [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ];
  }
}

// 현재 플레이어가 조종 중인 블록 객체
const player = {
  pos: { x: 3, y: 0 },
  matrix: createPiece('T') // 기본 T 블록으로 시작
};

// 매트릭스(블록)를 캔버스에 그리는 함수
function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = COLORS[value];
        // 1x1 크기의 블록을 그림 (scale이 30이므로 실제 30x30px)
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

// 전체 화면 렌더링 함수
function draw() {
  // 배경 지우기 (Macchiato surface0 색상)
  context.fillStyle = '#363a4f';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 현재 플레이어 블록 그리기
  drawMatrix(player.matrix, player.pos);
}

// 시계방향 회전 함수 (전치 행렬 후 각 행을 뒤집음)
function rotate(matrix) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  matrix.forEach(row => row.reverse());
}

// 조종 이벤트 리스너 (WASD 및 방향키 지원)
document.addEventListener('keydown', event => {
  const key = event.key;

  // 왼쪽 이동 (A, a, ←)
  if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
    player.pos.x--;
  }
  // 오른쪽 이동 (D, d, →)
  else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
    player.pos.x++;
  }
  // 아래로 이동 (S, s, ↓)
  else if (key === 'ArrowDown' || key === 's' || key === 'S') {
    player.pos.y++;
  }
  // 시계방향 회전 (W, w, ↑)
  else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
    rotate(player.matrix);
  }

  draw();
});

// 최초 1회 화면 그리기
draw();