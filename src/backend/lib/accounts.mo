/// Domain logic for accounts / profiles.
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Text "mo:core/Text";
import Types "../types/accounts";
import Common "../types/common";

module {
  /// The profile store, keyed by caller principal.
  public type ProfileStore = Map.Map<Common.UserId, Types.Profile>;

  /// Create a new empty profile store.
  public func newStore() : ProfileStore {
    Map.empty();
  };

  /// Convert an internal profile to its shared view.
  public func toView(profile : Types.Profile) : Types.ProfileView {
    {
      id = profile.id;
      displayName = profile.displayName;
      username = profile.username;
      bio = profile.bio;
      createdAt = profile.createdAt;
      updatedAt = profile.updatedAt;
    };
  };

  /// Return the caller's profile, if registered.
  public func getProfile(store : ProfileStore, caller : Common.UserId) : ?Types.ProfileView {
    switch (store.get(caller)) {
      case (?profile) { ?toView(profile) };
      case null { null };
    };
  };

  /// Return a profile by principal, if registered.
  public func getProfileById(store : ProfileStore, id : Common.UserId) : ?Types.ProfileView {
    switch (store.get(id)) {
      case (?profile) { ?toView(profile) };
      case null { null };
    };
  };

  /// Whether a username is already claimed by a different principal.
  /// Comparison is case-insensitive so "Alice" and "alice" collide.
  public func isUsernameTaken(store : ProfileStore, username : Text, except : Common.UserId) : Bool {
    let needle = username.toLower();
    var taken = false;
    for ((id, profile) in store.entries()) {
      if (not Principal.equal(id, except) and profile.username.toLower() == needle) {
        taken := true;
      };
    };
    taken;
  };

  /// A username is valid when, after trimming, it is non-empty and contains
  /// no whitespace.
  func isValidUsername(username : Text) : Bool {
    let trimmed = username.trim(#text " ");
    if (trimmed.isEmpty()) {
      return false;
    };
    not trimmed.contains(#text " ");
  };

  /// A display name is valid when, after trimming, it is non-empty.
  func isValidDisplayName(displayName : Text) : Bool {
    not displayName.trim(#text " ").isEmpty();
  };

  /// Create the caller's profile on first sign-in.
  /// Fails if the username is already taken or invalid.
  public func createProfile(
    store : ProfileStore,
    caller : Common.UserId,
    displayName : Text,
    username : Text,
    bio : Text,
    now : Common.Timestamp,
  ) : Result.Result<Types.ProfileView, Types.ProfileError> {
    if (not isValidDisplayName(displayName)) {
      return #err(#invalidDisplayName("Display name must not be empty"));
    };
    if (not isValidUsername(username)) {
      return #err(#invalidUsername("Username must be non-empty and contain no spaces"));
    };
    if (isUsernameTaken(store, username, caller)) {
      return #err(#usernameTaken(username));
    };
    let profile : Types.Profile = {
      id = caller;
      displayName = displayName.trim(#text " ");
      username = username.trim(#text " ");
      bio = bio;
      createdAt = now;
      updatedAt = now;
    };
    store.add(caller, profile);
    #ok(toView(profile));
  };

  /// Edit the caller's own profile. Fails if not registered or the new
  /// username collides with another profile.
  public func updateProfile(
    store : ProfileStore,
    caller : Common.UserId,
    displayName : Text,
    username : Text,
    bio : Text,
    now : Common.Timestamp,
  ) : Result.Result<Types.ProfileView, Types.ProfileError> {
    let existing = switch (store.get(caller)) {
      case (?profile) { profile };
      case null { return #err(#notRegistered) };
    };
    if (not isValidDisplayName(displayName)) {
      return #err(#invalidDisplayName("Display name must not be empty"));
    };
    if (not isValidUsername(username)) {
      return #err(#invalidUsername("Username must be non-empty and contain no spaces"));
    };
    if (isUsernameTaken(store, username, caller)) {
      return #err(#usernameTaken(username));
    };
    let updated : Types.Profile = {
      id = existing.id;
      displayName = displayName.trim(#text " ");
      username = username.trim(#text " ");
      bio = bio;
      createdAt = existing.createdAt;
      updatedAt = now;
    };
    store.add(caller, updated);
    #ok(toView(updated));
  };
};
