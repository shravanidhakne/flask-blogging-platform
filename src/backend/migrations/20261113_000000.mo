import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // Deployed stable shape: the canister starts from an empty actor, so the
  // whole chain is folded into this single pending migration.
  public type OldActor = {};

  // New stable shape: access control plus the profile store, the post store
  // and the post id state declared in main.mo.
  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    profiles : Map.Map<Principal, Profile>;
    posts : Map.Map<Nat, Post>;
    postState : { var nextPostId : Nat };
  };

  type Profile = {
    id : Principal;
    displayName : Text;
    username : Text;
    bio : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  type Post = {
    id : Nat;
    author : Principal;
    authorName : Text;
    authorUsername : Text;
    title : Text;
    content : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      profiles = Map.empty();
      posts = Map.empty();
      postState = { var nextPostId = 0 };
    };
  };
};
