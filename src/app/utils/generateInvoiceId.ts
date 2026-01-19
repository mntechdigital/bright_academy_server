// import prisma from '../../db/db.config';

// export const generateInvoiceId = async () => {
//   const now = new Date();
//   const month = String(now.getMonth() + 1).padStart(2, '0');
//   const year = String(now.getFullYear()).slice(2);
//   const day = String(now.getDate()).padStart(2, '0');
//   const hour = String(now.getHours()).padStart(2, '0');

//   let counter = 0;
//   const existingDonationInvoiceId = await prisma.donation.findFirst({
//     orderBy: { createdAt: 'desc' },
//     select: { invoiceId: true },
//   });

//   if (existingDonationInvoiceId) {
//     const lastInvoiceId = existingDonationInvoiceId.invoiceId;
//     if (lastInvoiceId) {
//       const lastCounter = parseInt(lastInvoiceId.slice(4, 8), 8);
//       counter = isNaN(lastCounter) ? 0 : lastCounter;
//     }
//   }

//   const getNextCounter = () => {
//     counter = (counter + 1) % 10000;
//     return String(counter).padStart(4, '0');
//   };

//   const counterValue = getNextCounter();
//   return `${month}${year}${counterValue}${day}${hour}`;
// };
