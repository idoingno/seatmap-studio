let lastLocalMutationAt = 0;

export const markLocalGraphMutation = () => {
  lastLocalMutationAt = Math.max(Date.now(), lastLocalMutationAt + 1);
  return lastLocalMutationAt;
};

export const hasNewerLocalGraphMutation = (startedAt: number) => {
  return lastLocalMutationAt > startedAt;
};
