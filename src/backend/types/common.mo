/// Cross-cutting types shared across backend domains.
module {
  /// A caller identity, derived from the Internet Identity principal.
  public type UserId = Principal;

  /// A point in time, in nanoseconds since the Unix epoch (signed).
  /// Produced by `Time.now()`; never negative in practice.
  public type Timestamp = Int;
};
