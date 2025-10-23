-- CreateTable
CREATE TABLE "AuthQuestion" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AuthQuestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AuthQuestion" ADD CONSTRAINT "AuthQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
