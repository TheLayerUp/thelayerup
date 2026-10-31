import { z } from "zod";

const indianPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/^(\+91|0)/, "").replace(/\s|-/g, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"));

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: indianPhone,
  line1: z.string().trim().min(5, "Address must be at least 5 characters"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export const checkoutSchema = z.object({
  address: addressSchema,
  items: z.array(cartLineSchema).min(1, "Your cart is empty").max(50),
  couponCode: z.string().trim().toUpperCase().optional(),
  notes: z.string().trim().max(500).optional(),
  saveAddress: z.boolean().optional(),
  paymentMethod: z.enum(["ONLINE", "COD"]).default("ONLINE"),
  locale: z.enum(["en", "hi"]).default("en"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email").transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email"),
  phone: z.string().trim().optional(),
  subject: z.string().trim().min(3, "Subject is required"),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name is required"),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  nameHi: z.string().trim().max(160).optional(),
  descriptionHi: z.string().trim().max(5000).optional(),
  features: z.string().optional(),
  price: z.coerce.number().int("Whole rupees only").positive("Price must be positive"),
  compareAtPrice: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  material: z.string().trim().optional(),
  color: z.string().trim().optional(),
  dimensions: z.string().trim().optional(),
  weightGrams: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  categoryId: z.string().min(1, "Category is required"),
  imageUrls: z.string().optional(),
  modelUrl: z
    .string()
    .trim()
    .regex(/\.(glb|gltf)(\?.*)?$/i, "Use a .glb or .gltf file")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5, "Review must be at least 5 characters"),
});

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .transform((v) => v.toUpperCase()),
  type: z.enum(["PERCENTAGE", "FLAT"]),
  value: z.coerce.number().int().positive(),
  minOrderValue: z.coerce.number().int().min(0).default(0),
  maxDiscount: z.coerce.number().int().positive().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  expiresAt: z.iso.datetime().optional(),
});

export const customOrderSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.email("Valid email is required"),
  phone: indianPhone,
  description: z.string().trim().min(20, "Please describe your requirement in detail (20+ characters)"),
  material: z.string().optional(),
  quantity: z.coerce.number().int().positive().max(10000).default(1),
  budget: z.string().optional(),
  deadline: z.string().optional(),
  fileUrl: z.url("Enter a valid link").optional().or(z.literal("")),
  kind: z.enum(["CUSTOM", "BULK"]).default("CUSTOM"),
  company: z.string().trim().max(120).optional(),
});

export const trackSchema = z.object({
  orderNumber: z.string().trim().toUpperCase().min(4),
  email: z.email().transform((v) => v.toLowerCase()),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type CustomOrderInput = z.infer<typeof customOrderSchema>;
