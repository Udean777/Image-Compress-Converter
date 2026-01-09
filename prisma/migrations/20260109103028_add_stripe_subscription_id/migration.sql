/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "updatedAt",
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
