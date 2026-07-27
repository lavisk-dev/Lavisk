import type { ShippingProvider } from "../types";
import { config } from "@/lib/core/config";

import { MockShippingProvider } from "./mock";
import { ShiprocketProvider } from "./shiprocket";
import { DelhiveryProvider } from "./delhivery";
import { BlueDartProvider } from "./bluedart";
import { DTDCProvider } from "./dtdc";
import { IndiaPostProvider } from "./indiapost";

const providers: Record<string, ShippingProvider> = {
  shiprocket: ShiprocketProvider,
  delhivery: DelhiveryProvider,
  bluedart: BlueDartProvider,
  dtdc: DTDCProvider,
  indiapost: IndiaPostProvider,
  mock: MockShippingProvider,
};

export function getShippingProvider(): ShippingProvider {
  const name = config.get("SHIPPING_PROVIDER") ?? "mock";
  const provider = providers[name];
  if (!provider) {
    return MockShippingProvider;
  }
  return provider;
}

export { ShiprocketProvider, MockShippingProvider, DelhiveryProvider, BlueDartProvider, DTDCProvider, IndiaPostProvider };

export type { ShippingProvider } from "../types";