const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-block');
const nextContext = nextCanvas.getContext('2d');

context.scale(30, 30);
nextContext.scale(30, 30);

// Catppuccin Macchiato 색상 팔레트
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

// 2차원 매트릭스 생성 함수
function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

// 10x20 크기의 게임 보드 생성
const arena = createMatrix(10, 20);

// 테트로미노 형태 생성
function createPiece(type) {
  if (type === 'T') return [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
  if (type === 'O') return [[2, 2], [2, 2]];
  if (type === 'L') return [[0, 0, 3], [3, 3, 3], [0, 0, 0]];
  if (type === 'J') return [[4, 0, 0], [4, 4, 4], [0, 0, 0]];
  if (type === 'I') return [[0, 0, 0, 0], [5, 5, 5, 5], [0, 0, 0, 0], [0, 0, 0, 0]];
  if (type === 'S') return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
  if (type === 'Z') return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
}

// 충돌 판정 함수 (벽, 바닥, 다른 블록과의 충돌 검사)
function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0) {
        const boardY = y + o.y;
        const boardX = x + o.x;
        // 벽/바닥을 벗어나거나, 보드에 이미 블록이 채워져 있는 경우
        if (
          boardX < 0 || boardX >= 10 ||
          boardY >= 20 ||
          (boardY >= 0 && arena[boardY][boardX] !== 0)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

// 고정된 블록을 보드 매트릭스에 합치는 함수
function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

// 범용 매트릭스 그리기 함수
function drawMatrix(matrix, offset, ctx = context) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = COLORS[value];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

// 화면 전체 렌더링
function draw() {
  // 메인 게임 보드 배경
  context.fillStyle = '#363a4f';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 보드에 쌓인 블록 그리기
  drawMatrix(arena, { x: 0, y: 0 });

  // 조종 중인 블록 그리기
  drawMatrix(player.matrix, player.pos);

  // 다음 블록 미리보기 그리기
  drawNext();
}

// 다음 블록 UI 렌더링
function drawNext() {
  nextContext.fillStyle = '#363a4f';
  nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  // 4x4 영역 중앙 정렬 배치
  const offset = {
    x: (4 - nextMatrix[0].length) / 2,
    y: (4 - nextMatrix.length) / 2
  };
  drawMatrix(nextMatrix, offset, nextContext);
}

// 시계방향 회전
function rotate(matrix) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  matrix.forEach(row => row.reverse());
}

// 회전 후 벽 침범 시 밀어내기 (Wall Kick)
function playerRotate() {
  const pos = player.pos.x;
  rotate(player.matrix);
  let offset = 1;

  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      // 회전 불가능 시 원복
      rotate(player.matrix);
      rotate(player.matrix);
      rotate(player.matrix);
      player.pos.x = pos;
      return;
    }
  }
}

// 블록 랜덤 뽑기
const PIECES = 'TOLJISZ';
function getRandomPiece() {
  return createPiece(PIECES[Math.floor(Math.random() * PIECES.length)]);
}

// 플레이어 및 게임 상태
const player = {
  pos: { x: 0, y: 0 },
  matrix: null
};

let nextMatrix = getRandomPiece();

// 새 블록 스폰
function playerReset() {
  player.matrix = nextMatrix;
  nextMatrix = getRandomPiece();
  player.pos.y = 0;
  player.pos.x = Math.floor((10 - player.matrix[0].length) / 2);
  lockStartTime = null; // 고정 타이머 초기화
}

// 바닥 접촉 확인
function isGrounded() {
  player.pos.y++;
  const grounded = collide(arena, player);
  player.pos.y--;
  return grounded;
}

// 자동 하강 및 1초 고정 지연 로직
let dropCounter = 0;
let dropInterval = 1000; // 1초마다 자동 하강
let lockStartTime = null;
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;

  // 바닥이나 다른 블록에 닿았는지 체크
  if (isGrounded()) {
    if (lockStartTime === null) {
      lockStartTime = time; // 닿은 시점 기록
    } else if (time - lockStartTime >= 1000) { // 1초 대기 후 고정
      merge(arena, player);
      playerReset();
    }
  } else {
    lockStartTime = null; // 공중에 떠있으면 고정 타이머 리셋
  }

  // 일정 시간마다 자동 하강
  if (dropCounter > dropInterval) {
    player.pos.y++;
    if (collide(arena, player)) {
      player.pos.y--;
    }
    dropCounter = 0;
  }

  draw();
  requestAnimationFrame(update);
}

// 키보드 조작
document.addEventListener('keydown', event => {
  const key = event.key;

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(key)) {
    event.preventDefault(); // 스크롤 방지
  }

  if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
    player.pos.x--;
    if (collide(arena, player)) player.pos.x++;
  } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
    player.pos.x++;
    if (collide(arena, player)) player.pos.x--;
  } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
    player.pos.y++;
    if (collide(arena, player)) {
      player.pos.y--;
    }
    dropCounter = 0;
  } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
    playerRotate();
  }
});

// 게임 시작
playerReset();
update();