/// Public API for the accounts / profiles domain.
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Time "mo:core/Time";
import AccountsLib "../lib/accounts";
import Types "../types/accounts";
import Common "../types/common";

mixin (
  profiles : AccountsLib.ProfileStore,
) {
  /// Return the caller's own profile, or null if not yet registered.
  public query ({ caller }) func getMyProfile() : async ?Types.ProfileView {
    AccountsLib.getProfile(profiles, caller);
  };

  /// Return any user's public profile by principal.
  public query func getProfile(id : Common.UserId) : async ?Types.ProfileView {
    AccountsLib.getProfileById(profiles, id);
  };

  /// Create the caller's profile on first sign-in.
  /// Requires a signed-in (non-anonymous) caller.
  public shared ({ caller }) func createProfile(
    displayName : Text,
    username : Text,
    bio : Text,
  ) : async Result.Result<Types.ProfileView, Types.ProfileError> {
    if (caller.isAnonymous()) {
      return #err(#notSignedIn);
    };
    AccountsLib.createProfile(profiles, caller, displayName, username, bio, Time.now());
  };

  /// Edit the caller's own profile information.
  /// Requires a signed-in (non-anonymous) caller.
  public shared ({ caller }) func updateProfile(
    displayName : Text,
    username : Text,
    bio : Text,
  ) : async Result.Result<Types.ProfileView, Types.ProfileError> {
    if (caller.isAnonymous()) {
      return #err(#notSignedIn);
    };
    AccountsLib.updateProfile(profiles, caller, displayName, username, bio, Time.now());
  };
};
