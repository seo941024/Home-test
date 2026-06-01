import random

class BowlingGame:
    def __init__(self):
        self.frames = []

    def roll_ball(self, pins_left):
        return random.randint(0, pins_left)

    def play_game(self):
        for frame in range(10):
            if frame < 9:   
                first = self.roll_ball(10)

                # 스트라이크
                if first == 10:
                    self.frames.append([10])
                else:
                    second = self.roll_ball(10 - first)
                    self.frames.append([first, second])
            else:
                # 10프레임
                frame_10 = []
                first = self.roll_ball(10)
                frame_10.append(first)

                if first == 10:
                    second = self.roll_ball(10)
                    third = self.roll_ball(10)
                    frame_10.extend([second, third])
                else:
                    second = self.roll_ball(10 - first)
                    frame_10.append(second)

                    if first + second == 10:
                        third = self.roll_ball(10)
                        frame_10.append(third)

                self.frames.append(frame_10)

    def calculate_score(self):
        score = 0
        rolls = [pin for frame in self.frames for pin in frame]

        roll_idx = 0
        for frame in range(10):
            # 스트라이크
            if rolls[roll_idx] == 10:
                score += 10 + rolls[roll_idx+1] + rolls[roll_idx+2]
                roll_idx += 1

            # 스페어
            elif rolls[roll_idx] + rolls[roll_idx+1] == 10:
                score += 10 + rolls[roll_idx+2]
                roll_idx += 2

            # 일반
            else:
                score += rolls[roll_idx] + rolls[roll_idx+1]
                roll_idx += 2

        return score

    def print_frames(self):
        print("\n🎳 프레임 결과")
        for i, frame in enumerate(self.frames):
            print(f"{i+1}프레임: {frame}")


# 실행
game = BowlingGame()
game.play_game()
game.print_frames()

total_score = game.calculate_score()
print(f"\n🏆 총 점수: {total_score}")