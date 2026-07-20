export class CompletionRegistry {
  private readonly ids = new Set<string>();

  constructor(private readonly limit = 32) {}

  claim(roundId: string) {
    if (this.ids.has(roundId)) return false;
    this.ids.add(roundId);
    if (this.ids.size > this.limit) {
      const oldest = this.ids.values().next().value as string | undefined;
      if (oldest) this.ids.delete(oldest);
    }
    return true;
  }

  get size() {
    return this.ids.size;
  }
}
