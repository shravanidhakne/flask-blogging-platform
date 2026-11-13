/// Composition root for the blogging backend.
///
/// Owns the stable state and wires the domain mixins and the OQL exposure.
/// No business logic lives here — every endpoint is provided by a mixin.
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import MapEntity "mo:caffeineai-oql/MapEntity";
import Entity "mo:caffeineai-oql/Entity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Principal "mo:core/Principal";
import AccountsLib "lib/accounts";
import PostsLib "lib/posts";
import AccountsApi "mixins/accounts-api";
import PostsApi "mixins/posts-api";
import ApiDocMixin "mixins/api-doc";

actor {
  // --- Stable state (initial values come from the migration chain) ---
  let accessControlState : AccessControl.AccessControlState;
  let profiles : AccountsLib.ProfileStore;
  let posts : PostsLib.PostStore;
  let postState : PostsLib.PostState;

  // --- Authorization (Internet Identity roles + access-control endpoints) ---
  include MixinAuthorization(accessControlState, null);

  // --- Domain APIs ---
  include AccountsApi(profiles);
  include PostsApi(posts, postState, profiles);

  // --- Behavioral API documentation ---
  include ApiDocMixin();

  // --- OQL exposure: the blog is world-readable, profiles are public display data ---
  transient let samplePrincipal = Principal.fromText("aaaaa-aa");

  include Expose({
    entities = [
      posts.toEntity("post", "Post", "id")
        .sample({
          id = 0;
          author = samplePrincipal;
          authorName = "";
          authorUsername = "";
          title = "";
          content = "";
          createdAt = 0;
          updatedAt = 0;
        })
        .public_()
        .build(),
      profiles.toEntity("profile", "Profile", "id")
        .sample({
          id = samplePrincipal;
          displayName = "";
          username = "";
          bio = "";
          createdAt = 0;
          updatedAt = 0;
        })
        .public_()
        .build(),
    ];
  });
};
