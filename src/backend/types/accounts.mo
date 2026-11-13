/// Types for the accounts / profiles domain.
import Common "../types/common";

module {
  /// A user profile, keyed by the caller principal.
  /// Created on first sign-in; editable by its owner only.
  public type Profile = {
    id : Common.UserId;
    displayName : Text;
    username : Text;
    bio : Text;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  /// The public, shared view of a profile returned across the API boundary.
  public type ProfileView = {
    id : Common.UserId;
    displayName : Text;
    username : Text;
    bio : Text;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  /// Caller-actionable failures for profile operations.
  public type ProfileError = {
    #notSignedIn;
    #notRegistered;
    #usernameTaken : Text;
    #invalidUsername : Text;
    #invalidDisplayName : Text;
  };
};
