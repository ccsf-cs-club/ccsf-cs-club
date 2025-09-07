import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import netlify from "@astrojs/netlify";
import icon from "astro-icon";
import auth from "auth-astro";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), icon(), auth()],
  adapter: netlify(),
  output: "server"
});

