let lastLocalMutationAt = 0;

export const markLocalGraphMutation = () => {
  lastLocalMutationAt = Date.now();
  return lastLocalMutationAt;
};

export const hasNewerLocalGraphMutation = (startedAt: number) => {
  return lastLocalMutationAt > startedAt;
};
