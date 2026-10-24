import { route } from "@/lib/server";
import { isPersistent, listBrands } from "@/lib/store";

export const dynamic = "force-dynamic";

// Without shared storage the browser keeps the brands, so there is nothing to list here.
export const GET = route(async () => ({
  brands: isPersistent ? await listBrands() : [],
  persistent: isPersistent,
}));
