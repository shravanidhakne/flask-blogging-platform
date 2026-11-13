import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Cell {
    value: Value;
    name: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type PostError = {
    __kind__: "notFound";
    notFound: bigint;
} | {
    __kind__: "invalidTitle";
    invalidTitle: string;
} | {
    __kind__: "notSignedIn";
    notSignedIn: null;
} | {
    __kind__: "notRegistered";
    notRegistered: null;
} | {
    __kind__: "invalidContent";
    invalidContent: string;
} | {
    __kind__: "notAuthor";
    notAuthor: null;
};
export interface PostView {
    id: bigint;
    title: string;
    authorUsername: string;
    content: string;
    createdAt: Timestamp;
    authorName: string;
    author: UserId;
    updatedAt: Timestamp;
}
export type ProfileError = {
    __kind__: "invalidUsername";
    invalidUsername: string;
} | {
    __kind__: "invalidDisplayName";
    invalidDisplayName: string;
} | {
    __kind__: "notSignedIn";
    notSignedIn: null;
} | {
    __kind__: "notRegistered";
    notRegistered: null;
} | {
    __kind__: "usernameTaken";
    usernameTaken: string;
};
export interface ProfileView {
    id: UserId;
    bio: string;
    username: string;
    displayName: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export type Result = {
    __kind__: "ok";
    ok: ProfileView;
} | {
    __kind__: "err";
    err: ProfileError;
};
export type Result_1 = {
    __kind__: "ok";
    ok: PostView;
} | {
    __kind__: "err";
    err: PostError;
};
export type Result_2 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: PostError;
};
export type Result_3 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Timestamp = bigint;
export type UserId = Principal;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
/**
 * / Composition root for the blogging backend.
 * /
 * / Owns the stable state and wires the domain mixins and the OQL exposure.
 * / No business logic lives here — every endpoint is provided by a mixin.
 */
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Create a post. Requires a signed-in caller with a registered profile.
     */
    createPost(title: string, content: string): Promise<Result_1>;
    /**
     * / Create the caller's profile on first sign-in.
     * / Requires a signed-in (non-anonymous) caller.
     */
    createProfile(displayName: string, username: string, bio: string): Promise<Result>;
    /**
     * / Delete the caller's own post. Requires a signed-in caller.
     */
    deletePost(id: bigint): Promise<Result_2>;
    execute(qJson: string): Promise<Result__1>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Return the caller's own profile, or null if not yet registered.
     */
    getMyProfile(): Promise<ProfileView | null>;
    /**
     * / Fetch a single post by id.
     */
    getPost(id: bigint): Promise<PostView | null>;
    /**
     * / Return any user's public profile by principal.
     */
    getProfile(id: UserId): Promise<ProfileView | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List all posts, newest first.
     */
    listPosts(): Promise<Array<PostView>>;
    /**
     * / List all posts by a given author, newest first.
     */
    listPostsByAuthor(author: UserId): Promise<Array<PostView>>;
    schema(): Promise<string>;
    /**
     * / Edit the caller's own post. Requires a signed-in caller.
     */
    updatePost(id: bigint, title: string, content: string): Promise<Result_1>;
    /**
     * / Edit the caller's own profile information.
     * / Requires a signed-in (non-anonymous) caller.
     */
    updateProfile(displayName: string, username: string, bio: string): Promise<Result>;
}
