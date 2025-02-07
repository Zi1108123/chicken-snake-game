import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const GRID_SIZE = 15, CELL_SIZE = 24, WINNING_SCORE = 50;
const IMAGES = {
  PLAYER_CHICKEN_HEAD: '🐔', PLAYER_CHICKEN_BODY: '🐣',
  AI_CHICKEN_HEAD: '🐓', AI_CHICKEN_BODY: '🐤',
  POOP: '💩', CAT: '🐱'
};
const DIRECTIONS = {
  UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 }
};

const generateRandomPosition = () => ({
  x: Math.floor(Math.random() * GRID_SIZE),
  y: Math.floor(Math.random() * GRID_SIZE)
});

const decideAIDirection = (aiChicken, specialItems) => {
  const head = aiChicken.body[0];
  const possibleDirections = Object.values(DIRECTIONS);

  // 优先寻找猫
  const catDirection = possibleDirections.find(dir => 
    head.x + dir.x === specialItems.cat.x && 
    head.y + dir.y === specialItems.cat.y
  );
  if (catDirection) return catDirection;

  // 避免自身碰撞
  const safeDirections = possibleDirections.filter(dir => {
    const newHead = {
      x: (head.x + dir.x + GRID_SIZE) % GRID_SIZE,
      y: (head.y + dir.y + GRID_SIZE) % GRID_SIZE
    };
    return !aiChicken.body.some(
      segment => segment.x === newHead.x && segment.y === newHead.y
    );
  });

  // 随机选择安全方向
  return safeDirections[Math.floor(Math.random() * safeDirections.length)] || 
         possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
};

const ChickenSnakeGame = () => {
  const [playerChicken, setPlayerChicken] = useState({
    body: [{ x: 7, y: 7 }],
    direction: DIRECTIONS.RIGHT,
    score: 0
  });

  const [aiChicken, setAiChicken] = useState({
    body: [{ x: 3, y: 3 }],
    direction: DIRECTIONS.LEFT,
    score: 0
  });

  const [specialItems, setSpecialItems] = useState({
    poop: generateRandomPosition(),
    cat: generateRandomPosition()
  });

  const [gameState, setGameState] = useState({
    isGameOver: false,
    winner: null,
    isPaused: false
  });

  useEffect(() => {
    if (gameState.isGameOver || gameState.isPaused) return;

    const moveChickens = () => {
      // 玩家鸡移动
      const playerNewBody = [...playerChicken.body];
      const playerHead = { ...playerNewBody[0] };
      playerHead.x += playerChicken.direction.x;
      playerHead.y += playerChicken.direction.y;
      playerHead.x = (playerHead.x + GRID_SIZE) % GRID_SIZE;
      playerHead.y = (playerHead.y + GRID_SIZE) % GRID_SIZE;

      // AI鸡移动
      const aiNewBody = [...aiChicken.body];
      const aiHead = { ...aiNewBody[0] };
      const aiNewDirection = decideAIDirection(aiChicken, specialItems);
      aiHead.x += aiNewDirection.x;
      aiHead.y += aiNewDirection.y;
      aiHead.x = (aiHead.x + GRID_SIZE) % GRID_SIZE;
      aiHead.y = (aiHead.y + GRID_SIZE) % GRID_SIZE;

      // 碰撞检测
      const playerSelfCollision = playerChicken.body.some(
        segment => segment.x === playerHead.x && segment.y === playerHead.y
      );
      const aiSelfCollision = aiChicken.body.some(
        segment => segment.x === aiHead.x && segment.y === aiHead.y
      );
      const playerAiCollision = 
        playerHead.x === aiHead.x && playerHead.y === aiHead.y;

      if (playerSelfCollision || aiSelfCollision || playerAiCollision) {
        setGameState(prev => ({ 
          ...prev, 
          isGameOver: true,
          winner: playerAiCollision ? 'AI' : 
                  (playerSelfCollision ? 'AI' : 
                  (aiSelfCollision ? '玩家' : null))
        }));
        return;
      }

      // 插入新头部
      playerNewBody.unshift(playerHead);
      aiNewBody.unshift(aiHead);

      // 特殊物品碰撞检测
      const playerAteCat = 
        playerHead.x === specialItems.cat.x && 
        playerHead.y === specialItems.cat.y;
      const playerAtePoop = 
        playerHead.x === specialItems.poop.x && 
        playerHead.y === specialItems.poop.y;
      
      const aiAteCat = 
        aiHead.x === specialItems.cat.x && 
        aiHead.y === specialItems.cat.y;
      const aiAtePoop = 
        aiHead.x === specialItems.poop.x && 
        aiHead.y === specialItems.poop.y;

      // 处理玩家鸡吃到的物品
      if (playerAtePoop) {
        if (playerNewBody.length > 3) {
          playerNewBody.pop();
        } else {
          playerNewBody.splice(1);
        }
      } else if (!playerAteCat) {
        playerNewBody.pop();
      }

      // 处理AI鸡吃到的物品
      if (aiAtePoop) {
        if (aiNewBody.length > 3) {
          aiNewBody.pop();
        } else {
          aiNewBody.splice(1);
        }
      } else if (!aiAteCat) {
        aiNewBody.pop();
      }

      // 重新生成特殊物品
      const newSpecialItems = { ...specialItems };
      if (playerAteCat || aiAteCat) {
        newSpecialItems.cat = generateRandomPosition();
      }
      if (playerAtePoop || aiAtePoop) {
        newSpecialItems.poop = generateRandomPosition();
      }
      setSpecialItems(newSpecialItems);

      // 更新鸡的状态
      setPlayerChicken(prev => ({
        ...prev,
        body: playerNewBody
      }));
      setAiChicken(prev => ({
        ...prev,
        body: aiNewBody,
        direction: aiNewDirection
      }));

      // 检查胜利条件
      if (playerChicken.body.length >= WINNING_SCORE || 
          aiChicken.body.length >= WINNING_SCORE) {
        setGameState(prev => ({ 
          ...prev, 
          isGameOver: true,
          winner: playerChicken.body.length >= WINNING_SCORE ? '玩家' : 'AI'
        }));
      }
    };

    const gameInterval = setInterval(moveChickens, 200);
    return () => clearInterval(gameInterval);
  }, [playerChicken, aiChicken, specialItems, gameState]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp':
          if (playerChicken.direction !== DIRECTIONS.DOWN)
            setPlayerChicken(prev => ({ ...prev, direction: DIRECTIONS.UP }));
          break;
        case 'ArrowDown':
          if (playerChicken.direction !== DIRECTIONS.UP)
            setPlayerChicken(prev => ({ ...prev, direction: DIRECTIONS.DOWN }));
          break;
        case 'ArrowLeft':
          if (playerChicken.direction !== DIRECTIONS.RIGHT)
            setPlayerChicken(prev => ({ ...prev, direction: DIRECTIONS.LEFT }));
          break;
        case 'ArrowRight':
          if (playerChicken.direction !== DIRECTIONS.LEFT)
            setPlayerChicken(prev => ({ ...prev, direction: DIRECTIONS.RIGHT }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerChicken.direction]);

  // 重新开始游戏
  const restartGame = () => {
    setPlayerChicken({
      body: [{ x: 7, y: 7 }],
      direction: DIRECTIONS.RIGHT,
      score: 0
    });
    setAiChicken({
      body: [{ x: 3, y: 3 }],
      direction: DIRECTIONS.LEFT,
      score: 0
    });
    setSpecialItems({
      poop: generateRandomPosition(),
      cat: generateRandomPosition()
    });
    setGameState({
      isGameOver: false,
      winner: null,
      isPaused: false
    });
  };

  // 渲染游戏面板
  const renderGameBoard = () => {
    const board = Array(GRID_SIZE).fill().map(() => 
      Array(GRID_SIZE).fill(null)
    );

    // 标记玩家鸡的身体
    playerChicken.body.forEach((segment, index) => {
      board[segment.y][segment.x] = index === 0 
        ? IMAGES.PLAYER_CHICKEN_HEAD 
        : IMAGES.PLAYER_CHICKEN_BODY;
    });

    // 标记AI鸡的身体
    aiChicken.body.forEach((segment, index) => {
      board[segment.y][segment.x] = index === 0 
        ? IMAGES.AI_CHICKEN_HEAD 
        : IMAGES.AI_CHICKEN_BODY;
    });

    // 标记特殊物品
    board[specialItems.poop.y][specialItems.poop.x] = IMAGES.POOP;
    board[specialItems.cat.y][specialItems.cat.x] = IMAGES.CAT;

    return board;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div>贪吃鸡对战</div>
          <div className="text-sm">
            玩家: {playerChicken.body.length - 1} | AI: {aiChicken.body.length - 1}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gameState.isGameOver ? (
          <div className="text-center text-red-500 mb-4">
            {gameState.winner === '玩家' ? '玩家获胜！' : 'AI获胜！'}
            <Button 
              onClick={restartGame} 
              className="ml-4"
            >
              重新开始
            </Button>
          </div>
        ) : null}

        <div 
          className="mx-auto relative"
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            border: '2px solid #000'
          }}
        >
          {renderGameBoard().map((row, y) => 
            row.map((cell, x) => (
              <div 
                key={`${x}-${y}`}
                className="border border-gray-200 flex items-center justify-center text-2xl"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE
                }}
              >
                {cell}
              </div>
            ))
          )}
        </div>

        {/* 移动控制按钮 */}
        <div className="mt-4 grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
          <div className="col-start-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setPlayerChicken(prev => 
                prev.direction !== DIRECTIONS.DOWN 
                  ? { ...prev, direction: DIRECTIONS.UP } 
                  : prev
              )}
            >
              上
            </Button>
          </div>
          <div className="col-start-1 row-start-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setPlayerChicken(prev => 
                prev.direction !== DIRECTIONS.RIGHT 
                  ? { ...prev, direction: DIRECTIONS.LEFT } 
                  : prev
              )}
            >
              左
            </Button>
          </div>
          <div className="col-start-2 row-start-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setPlayerChicken(prev => 
                prev.direction !== DIRECTIONS.UP 
                  ? { ...prev, direction: DIRECTIONS.DOWN } 
                  : prev
              )}
            >
              下
            </Button>
          </div>
          <div className="col-start-3 row-start-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setPlayerChicken(prev => 
                prev.direction !== DIRECTIONS.LEFT 
                  ? { ...prev, direction: DIRECTIONS.RIGHT } 
                  : prev
              )}
            >
              右
            </Button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-600">
          吃猫变长 | 吃大便变短 | 尽可能生存
        </div>
      </CardContent>
    </Card>
  );
};

export default ChickenSnakeGame;