/// Public API for the blog posts domain.
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Time "mo:core/Time";
import PostsLib "../lib/posts";
import AccountsLib "../lib/accounts";
import Types "../types/posts";
import Common "../types/common";

mixin (
  posts : PostsLib.PostStore,
  postState : PostsLib.PostState,
  profiles : AccountsLib.ProfileStore,
) {
  /// List all posts, newest first.
  public query func listPosts() : async [Types.PostView] {
    PostsLib.listPosts(posts);
  };

  /// List all posts by a given author, newest first.
  public query func listPostsByAuthor(author : Common.UserId) : async [Types.PostView] {
    PostsLib.listPostsByAuthor(posts, author);
  };

  /// Fetch a single post by id.
  public query func getPost(id : Nat) : async ?Types.PostView {
    PostsLib.getPost(posts, id);
  };

  /// Create a post. Requires a signed-in caller with a registered profile.
  public shared ({ caller }) func createPost(
    title : Text,
    content : Text,
  ) : async Result.Result<Types.PostView, Types.PostError> {
    if (caller.isAnonymous()) {
      return #err(#notSignedIn);
    };
    let profile = switch (profiles.get(caller)) {
      case (?profile) { profile };
      case null { return #err(#notRegistered) };
    };
    PostsLib.createPost(posts, postState, caller, profile, title, content, Time.now());
  };

  /// Edit the caller's own post. Requires a signed-in caller.
  public shared ({ caller }) func updatePost(
    id : Nat,
    title : Text,
    content : Text,
  ) : async Result.Result<Types.PostView, Types.PostError> {
    if (caller.isAnonymous()) {
      return #err(#notSignedIn);
    };
    PostsLib.updatePost(posts, caller, id, title, content, Time.now());
  };

  /// Delete the caller's own post. Requires a signed-in caller.
  public shared ({ caller }) func deletePost(
    id : Nat,
  ) : async Result.Result<(), Types.PostError> {
    if (caller.isAnonymous()) {
      return #err(#notSignedIn);
    };
    PostsLib.deletePost(posts, caller, id);
  };
};
