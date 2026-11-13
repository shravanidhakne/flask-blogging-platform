/// Domain logic for blog posts.
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Result "mo:core/Result";
import Types "../types/posts";
import AccountsTypes "../types/accounts";
import Common "../types/common";

module {
  /// The post store, keyed by post id.
  public type PostStore = Map.Map<Nat, Types.Post>;

  /// Mutable counter for the next post id.
  public type PostState = { var nextPostId : Nat };

  /// Create an empty post store.
  public func newStore() : PostStore {
    Map.empty();
  };

  /// Create the initial post counter state.
  public func newState() : PostState {
    { var nextPostId = 0 };
  };

  /// Convert an internal post to its shared view.
  public func toView(post : Types.Post) : Types.PostView {
    {
      id = post.id;
      author = post.author;
      authorName = post.authorName;
      authorUsername = post.authorUsername;
      title = post.title;
      content = post.content;
      createdAt = post.createdAt;
      updatedAt = post.updatedAt;
    };
  };

  /// True when the text has no non-whitespace characters.
  func isBlank(text : Text) : Bool {
    text.trim(#predicate(func(c : Char) : Bool { c == ' ' or c == '\t' or c == '\n' or c == '\r' })).size() == 0;
  };

  /// Trim surrounding whitespace from a text value.
  func trimWhitespace(text : Text) : Text {
    text.trim(#predicate(func(c : Char) : Bool { c == ' ' or c == '\t' or c == '\n' or c == '\r' }));
  };

  /// Newest first: higher `createdAt` sorts before lower.
  func byNewest(a : Types.Post, b : Types.Post) : { #less; #equal; #greater } {
    if (a.createdAt > b.createdAt) { #less } else if (a.createdAt < b.createdAt) {
      #greater;
    } else {
      #equal;
    };
  };

  /// List all posts, newest first.
  public func listPosts(store : PostStore) : [Types.PostView] {
    let all = store.values().toArray();
    let sorted = all.sort(byNewest);
    sorted.map(func post = toView(post));
  };

  /// List all posts by a given author, newest first.
  public func listPostsByAuthor(store : PostStore, author : Common.UserId) : [Types.PostView] {
    let all = store.values().toArray();
    let mine = all.filter(func post = post.author == author);
    let sorted = mine.sort(byNewest);
    sorted.map(func post = toView(post));
  };

  /// Fetch a single post by id.
  public func getPost(store : PostStore, id : Nat) : ?Types.PostView {
    switch (store.get(id)) {
      case (?post) { ?toView(post) };
      case null { null };
    };
  };

  /// Create a post authored by the caller. The author's display name and
  /// username are denormalized from their profile.
  public func createPost(
    store : PostStore,
    state : PostState,
    author : Common.UserId,
    authorProfile : AccountsTypes.Profile,
    title : Text,
    content : Text,
    now : Common.Timestamp,
  ) : Result.Result<Types.PostView, Types.PostError> {
    if (isBlank(title)) {
      return #err(#invalidTitle("Title must not be empty"));
    };
    if (isBlank(content)) {
      return #err(#invalidContent("Content must not be empty"));
    };
    let id = state.nextPostId;
    state.nextPostId := id + 1;
    let post : Types.Post = {
      id;
      author;
      authorName = authorProfile.displayName;
      authorUsername = authorProfile.username;
      title = trimWhitespace(title);
      content = trimWhitespace(content);
      createdAt = now;
      updatedAt = now;
    };
    store.add(id, post);
    #ok(toView(post));
  };

  /// Edit the caller's own post. Fails if the post is missing or the caller
  /// is not its author.
  public func updatePost(
    store : PostStore,
    caller : Common.UserId,
    id : Nat,
    title : Text,
    content : Text,
    now : Common.Timestamp,
  ) : Result.Result<Types.PostView, Types.PostError> {
    let existing = switch (store.get(id)) {
      case (?post) { post };
      case null { return #err(#notFound(id)) };
    };
    if (existing.author != caller) {
      return #err(#notAuthor);
    };
    if (isBlank(title)) {
      return #err(#invalidTitle("Title must not be empty"));
    };
    if (isBlank(content)) {
      return #err(#invalidContent("Content must not be empty"));
    };
    let updated : Types.Post = {
      id = existing.id;
      author = existing.author;
      authorName = existing.authorName;
      authorUsername = existing.authorUsername;
      title = trimWhitespace(title);
      content = trimWhitespace(content);
      createdAt = existing.createdAt;
      updatedAt = now;
    };
    store.add(id, updated);
    #ok(toView(updated));
  };

  /// Delete the caller's own post. Fails if the post is missing or the caller
  /// is not its author.
  public func deletePost(
    store : PostStore,
    caller : Common.UserId,
    id : Nat,
  ) : Result.Result<(), Types.PostError> {
    let existing = switch (store.get(id)) {
      case (?post) { post };
      case null { return #err(#notFound(id)) };
    };
    if (existing.author != caller) {
      return #err(#notAuthor);
    };
    store.remove(id);
    #ok(());
  };
};
