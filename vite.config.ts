/// <reference types="vitest/config" />
import { PluginOption, ResolvedConfig, defineConfig } from "vite";

import react from "@vitejs/plugin-react";
import eslint from "vite-plugin-eslint";
import svgr from "vite-plugin-svgr";

import { execSync } from "node:child_process";
import dns from "node:dns";

import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import { load as cheerioLoad } from "cheerio";

dns.setDefaultResultOrder("verbatim");

function gitCommitHash() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    root: "src",
    base: "/",
    define: {
      __VERSION__: JSON.stringify(process.env.npm_package_version),
      __COMMIT_HASH__: JSON.stringify(gitCommitHash()),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      __BUILD_ENV__: JSON.stringify(process.env.NODE_ENV),
      ...(mode === "production" && {
        __REACT_DEVTOOLS_GLOBAL_HOOK__: JSON.stringify(
          "({ isDisabled: true })",
        ),
      }),
    },
    server: {
      port: 15160,
      open: true,
      hmr: true, // Hot Module Replacement 활성화
    },
    resolve: {
      alias: {
        assets: "/assets",
        components: "/components",
        contexts: "/contexts",
        core: "/core",
        pages: "/pages",
        strings: "/strings",
      },
      /**
       * react-three-fiber 는 React 컨텍스트를 모듈 스코프에 들고 있습니다.
       * 번들에 인스턴스가 두 개 들어가면 drei 의 useThree 가 다른 컨텍스트를 읽어
       * "R3F: Hooks can only be used within the Canvas component!" 로 터집니다.
       * 설치 환경에 따라 재현되므로 여기서 단일 인스턴스를 강제합니다.
       */
      dedupe: ["react", "react-dom", "three", "@react-three/fiber"],
    },
    publicDir: "../public",
    plugins: [react(), eslint(), svgr(), sri()],
    build: {
      outDir: process.env.TEST === "true" ? "../test/build" : "../build",
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name?.endsWith(".css") ? "css" : "media";
            return `static/${extType}/[name]-[hash][extname]`;
          },
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              return "vendor";
            }
          },
        },
      },
    },
    css: {
      modules: {
        generateScopedName:
          mode === "production"
            ? "[hash:base64:5]"
            : mode === "test"
              ? "[path][name]__[local]"
              : undefined,
      },
      preprocessorOptions: {
        scss: {
          silenceDeprecations: [
            "slash-div",
            "function-units",
            "mixed-decls",
            "import",
            "global-builtin",
            "color-functions",
          ] as any,
        },
      },
    },
    optimizeDeps: {
      // 종속성 사전 최적화
      // 3D 관련 패키지를 명시하지 않으면 Vite 가 이들을 "나중에" 발견해
      // 두 번째 최적화 번들을 만들고, 그때 fiber 인스턴스가 둘로 갈라집니다.
      include: [
        "react",
        "react-dom",
        "three",
        "@react-three/fiber",
        "@react-three/drei",
      ],
    },
    test: {
      environment: "node",
      include: ["**/*.test.ts"],
    },
  };
});

/**
 * Add subresource integrity hashes
 * https://github.com/VividLemon/vite-plugin-sri/blob/d79314d24c26c18f0e94c2daad6b53c4dedbc192/src/index.ts
 */
function sri(): PluginOption {
  let config: ResolvedConfig;
  return {
    name: "vite-plugin-sri",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    enforce: "post",
    apply: "build",

    async writeBundle(options, bundle) {
      const htmls = Object.keys(bundle)
        .filter((filename) => filename.endsWith(".html"))
        .map((filename) => {
          const bundleItem = bundle[filename];
          if (bundleItem.type === "asset") {
            return {
              name: bundleItem.fileName,
              source: bundleItem.source,
            };
          }
        })
        .filter((item) => !!item) as Array<{
        name: string;
        source: string;
      }>;

      for (const { name, source: html } of htmls) {
        // eslint-disable-next-line id-length
        const $ = cheerioLoad(html);

        const elements = [
          ...$("script").filter("[src]").toArray(),
          ...$("link[rel=stylesheet]").filter("[href]").toArray(),
          ...$("link[rel=modulepreload]").filter("[href]").toArray(),
        ];

        for (const element of elements) {
          let source: string | Uint8Array | undefined;
          const attributeName = element.attribs.src ? "src" : "href";
          const resourceUrl = element.attribs[attributeName];

          const resourcePath =
            resourceUrl.indexOf(config.base) === 0
              ? resourceUrl.substring(config.base.length)
              : resourceUrl;

          const target = Object.entries(bundle).find(
            ([, bundleItem]) => bundleItem.fileName === resourcePath,
          )?.[1];

          if (!target) {
            config.logger.warn(`cannot find ${resourcePath} in output bundle.`);
            try {
              source = await fs.readFile(
                path.resolve(options.dir as string, resourcePath),
              );
            } catch {
              source = undefined;
            }
          } else {
            if (target.type === "asset") {
              source = target.source;
            } else {
              source = target.code;
            }
          }

          if (source)
            element.attribs.integrity = `sha512-${createHash("sha512")
              .update(source)
              .digest()
              .toString("base64")}`;
        }

        await fs.writeFile(
          path.resolve(
            config?.root as string,
            config?.build.outDir as string,
            name,
          ),
          $.html(),
        );
      }
    },
  };
}
