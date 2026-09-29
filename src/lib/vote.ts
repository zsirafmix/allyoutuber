import prisma from './prisma';

export interface CastVoteInput {
  queueItemId: string;
  userId: string;
  roomId: string;
  value: 1 | -1;
}

export async function castVote(input: CastVoteInput) {
  const { queueItemId, userId, roomId, value } = input;

  const item = await prisma.queueItem.findUnique({
    where: { id: queueItemId },
  });

  if (!item || item.roomId !== roomId) {
    throw new Error('Queue item not found.');
  }

  // Check existing vote
  const existingVote = await prisma.vote.findUnique({
    where: {
      queueItemId_userId: {
        queueItemId,
        userId,
      },
    },
  });

  let userCurrentVote = 0;

  if (existingVote) {
    if (existingVote.value === value) {
      // Toggle / retract vote
      await prisma.vote.delete({
        where: { id: existingVote.id },
      });
      userCurrentVote = 0;
    } else {
      // Switch vote
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { value },
      });
      userCurrentVote = value;
    }
  } else {
    // New vote
    await prisma.vote.create({
      data: {
        queueItemId,
        userId,
        roomId,
        value,
      },
    });
    userCurrentVote = value;
  }

  // Recalculate score
  const aggregate = await prisma.vote.aggregate({
    where: { queueItemId },
    _sum: { value: true },
  });

  const newScore = aggregate._sum.value || 0;

  const updatedItem = await prisma.queueItem.update({
    where: { id: queueItemId },
    data: { score: newScore },
  });

  return {
    queueItemId,
    score: newScore,
    userVote: userCurrentVote,
    item: updatedItem,
  };
}
