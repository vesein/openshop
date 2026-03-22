import { mock } from "bun:test";

type MockModuleFn = (specifier: string, factory: () => Record<string, unknown>) => void;

/** Bun 运行时支持 `mock.module`；部分 @types 未声明，避免 tsc 将 `mock` 仅识别为 spy 工厂 */
export function mockServiceModule(specifier: string, factory: () => Record<string, unknown>): void {
  const m = mock as unknown as { module: MockModuleFn };
  m.module(specifier, factory);
}
