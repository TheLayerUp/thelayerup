-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "nameHi" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "descriptionHi" TEXT,
ADD COLUMN     "nameHi" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en';

