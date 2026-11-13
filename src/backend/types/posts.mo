/// Types for the blog posts domain.
import Common "../types/common";

module {
  /// A blog post. `content` is rich-text HTML produced by the editor.
  /// `authorName` / `authorUsername` are denormalized from the author's
  /// profile at write time so listings render without a profile lookup.
  public type Post = {
    id : Nat;
    author : Common.UserId;
    authorName : Text;
    authorUsername : Text;
    title : Text;
    content : Text;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  /// The public, shared view of a post returned across the API boundary.
  public type PostView = {
    id : Nat;
    author : Common.UserId;
    authorName : Text;
    authorUsername : Text;
    title : Text;
    content : Text;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  /// Caller-actionable failures for post operations.
  public type PostError = {
    #notSignedIn;
    #notFound : Nat;
    #notAuthor;
    #notRegistered;
    #invalidTitle : Text;
    #invalidContent : Text;
  };
};
