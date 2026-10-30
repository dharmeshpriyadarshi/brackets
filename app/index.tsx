
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../src/lib/supabase";
import * as Clipboard from "expo-clipboard";

type BracketSpace = {
  id: string;
  bracket_id: string;
  media_type: "text" | "image" | "audio" | "video" | "link";
  content: string | null;
  sequence_order: number;
};

type Bracket = {
  id: string;
  name: string;
  creator_id: string;
  created_at: string;
  is_chat: boolean;
  is_public: boolean;
  bracket_spaces: BracketSpace[];
};

export default function HomeScreen() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [feed, setFeed] = useState<Bracket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [followFeedback, setFollowFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [followLoading, setFollowLoading] = useState(false);

  const requestId = useRef(0);

  const [selectedBracket, setSelectedBracket] =
  useState<Bracket | null>(null);

  const [confirmDeleteBracket, setConfirmDeleteBracket] =
  useState(false);

  const fetchFeed = useCallback(async (isRefresh = false) => {
    const currentRequest = ++requestId.current;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from("brackets")
        .select(`
          *,
          bracket_spaces (*)
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (currentRequest === requestId.current) {
        setFeed((data ?? []) as Bracket[]);
      }
    } catch (error: unknown) {
      if (currentRequest === requestId.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load the feed. Please try again."
        );
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setSessionLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionLoading(false);
    });

    void fetchFeed();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      requestId.current += 1;
    };
  }, [fetchFeed]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/auth");
  };

  if (sessionLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-gray-600 dark:text-gray-300">
          Loading Brackets...
        </Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6 dark:bg-gray-900">
        <Text className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Welcome to Brackets
        </Text>
        <Text className="mb-6 text-center text-gray-600 dark:text-gray-300">
          Sign in to explore and create your Brackets.
        </Text>
        <TouchableOpacity
          className="rounded-xl bg-blue-600 px-6 py-3"
          onPress={() => router.push("/auth")}
        >
          <Text className="font-semibold text-white">Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }




const renderBracket = ({ item }: { item: Bracket }) => {
  const spaces = [...(item.bracket_spaces ?? [])].sort(
    (a, b) => a.sequence_order - b.sequence_order
  );

  const isOwner = session?.user?.id === item.creator_id;

  return (
    <View className="mb-5 rounded-2xl border border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-800">

{/* Bracket Header: Title Left, Actions Right */}
<View className="mb-4 flex-row items-center justify-between px-4">
  <View className="mr-3 flex-1 flex-row flex-wrap items-start">
    <Text className="mr-1 text-xl font-bold text-indigo-600 dark:text-indigo-400">
      {"{"}
    </Text>

    <Text className="flex-shrink text-xl font-bold tracking-tight text-gray-900 dark:text-white">
      {item.name}
    </Text>

    <Text className="ml-1 text-xl font-bold text-indigo-600 dark:text-indigo-400">
      {"}"}
    </Text>
  </View>


<TouchableOpacity
  className="h-10 w-12 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/30"
 onPress={() => {
  setConfirmDeleteBracket(false);
  setSelectedBracket(item);
 }}
  accessibilityRole="button"
  accessibilityLabel={`Open actions for ${item.name}`}
>
  <Text className="text-base font-bold text-indigo-600 dark:text-indigo-400">
    {"{ }"}
  </Text>
</TouchableOpacity>

</View>


      {/* Vertically Stacked Spaces with Universal Actions */}
      <View className="gap-3 px-3">
        {spaces.map((space, index) => (
          <View key={space.id}>
            <View className="flex-row items-stretch gap-2">
              <View className="min-h-[80px] flex-1 justify-center rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                {space.media_type === "text" ? (
                  <Text className="text-base leading-6 text-gray-800 dark:text-gray-200">
                    {space.content || "This space has no text yet."}
                  </Text>
                ) : (
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {space.media_type} content
                  </Text>
                )}
              </View>


            </View>

            {index < spaces.length - 1 && (
              <View className="ml-5 mt-1 h-3 w-px bg-indigo-300 dark:bg-indigo-700" />
            )}
          </View>
        ))}
      </View>

      {spaces.length === 0 && (
        <Text className="px-4 py-3 text-gray-500 dark:text-gray-400">
          No spaces in this Bracket yet.
        </Text>
      )}

      {/* Temporary creator-only add button; replaced by the action menu later */}
      {isOwner && (
        <TouchableOpacity
          className="mx-3 mt-3 min-h-[52px] flex-row items-center justify-center rounded-xl border border-dashed border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30"
          onPress={() =>
            console.log(`Trigger Add Space Modal for Bracket: ${item.id}`)
          }
          accessibilityRole="button"
          accessibilityLabel={`Add content to ${item.name}`}
        >
          <Text className="mr-2 text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
            +
          </Text>
          <Text className="font-medium text-indigo-600 dark:text-indigo-400">
            Add to Bracket
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};




  return (
    <View className="flex-1 bg-gray-50 px-4 dark:bg-gray-900">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Public Brackets
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Signed in as {session.user.email ?? "user"}
          </Text>
        </View>

        <TouchableOpacity
          className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600"
          onPress={handleSignOut}
        >
          <Text className="text-gray-800 dark:text-white">Sign Out</Text>
        </TouchableOpacity>
      </View>

      {errorMessage && (
        <View className="mb-4 rounded-xl bg-red-100 p-3 dark:bg-red-950">
          <Text className="mb-2 text-red-700 dark:text-red-200">
            {errorMessage}
          </Text>
          <TouchableOpacity onPress={() => void fetchFeed()}>
            <Text className="font-semibold text-red-700 dark:text-red-200">
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={renderBracket}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void fetchFeed(true)}
          />
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        ListEmptyComponent={
          !errorMessage ? (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-center text-gray-600 dark:text-gray-300">
                No public Brackets yet. Create one and make it public.
              </Text>
            </View>
          ) : null
        }
      />


<Modal
  visible={selectedBracket !== null}
  transparent
  animationType="fade"
  statusBarTranslucent
  onRequestClose={() => {
    setSelectedBracket(null);
    setConfirmDeleteBracket(false);
  }}
>
  <View className="flex-1 items-center justify-center bg-black/50 px-5 py-8">
    <Pressable
      className="absolute inset-0"
      onPress={() => {
        setSelectedBracket(null);
        setConfirmDeleteBracket(false);
      }}
      accessibilityLabel="Close menu"
    />

    {selectedBracket && (
      <View className="w-full max-w-md rounded-3xl border border-gray-200 bg-white px-5 pb-6 pt-3 dark:border-gray-700 dark:bg-gray-900">
        <View className="mb-5 items-center">
          <View className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
        </View>

        {confirmDeleteBracket ? (
          <>
            <Text className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Delete this Bracket?
            </Text>

            <Text className="mb-5 text-sm leading-5 text-gray-600 dark:text-gray-300">
              "{selectedBracket.name}" and its spaces would be affected.
              This action is not implemented yet.
            </Text>

            <TouchableOpacity
              className="mb-3 items-center rounded-xl bg-red-600 px-4 py-3"
              onPress={() => {
                console.log(
                  `Confirm delete bracket: ${selectedBracket.id}`
                );
                setConfirmDeleteBracket(false);
                setSelectedBracket(null);
              }}
            >
              <Text className="font-semibold text-white">
                Confirm (Preview Only)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700"
              onPress={() => setConfirmDeleteBracket(false)}
            >
              <Text className="font-medium text-gray-800 dark:text-gray-200">
                Go Back
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
              {"{ "}
              {selectedBracket.name}
              {" }"}
            </Text>

            <Text className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              Bracket actions
            </Text>


            {/* TASK 11: Display follow action success and error feedback. */}
            {followFeedback && (
              <View
                className={`mb-3 rounded-xl border px-3 py-3 ${
                  followFeedback.type === "success"
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                }`}
              >
              <Text
                className={`text-sm ${
                  followFeedback.type === "success"
                  ? "text-green-800 dark:text-green-300"
                  : "text-red-800 dark:text-red-300"
                }`}
              >
            {followFeedback.message}
    </Text>
  </View>
)}


            {session?.user?.id === selectedBracket.creator_id ? (
              <>
                <TouchableOpacity
                  className="mb-2 rounded-xl bg-indigo-50 px-4 py-4 dark:bg-indigo-900/30"
                  onPress={() => {
                    console.log(
                      `Add space to bracket: ${selectedBracket.id}`
                    );
                    setSelectedBracket(null);
                  }}
                >
                  <Text className="font-semibold text-indigo-700 dark:text-indigo-300">
                    + Add a space
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="mb-2 rounded-xl bg-gray-50 px-4 py-4 dark:bg-gray-800"
                  onPress={() => {
                    console.log(
                      `Rename bracket: ${selectedBracket.id}`
                    );
                    setSelectedBracket(null);
                  }}
                >
                  <Text className="font-medium text-gray-900 dark:text-white">
                    Rename bracket
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="mb-2 rounded-xl bg-red-50 px-4 py-4 dark:bg-red-950"
                  onPress={() => setConfirmDeleteBracket(true)}
                >
                  <Text className="font-semibold text-red-700 dark:text-red-300">
                    Delete bracket
                  </Text>
                </TouchableOpacity>
              </>

) : (
  <>
    {[
      { label: "Follow creator", icon: "+" },
      { label: "Follow this bracket", icon: "Ã¢â€ â€”" },
      { label: "Reshare bracket", icon: "Ã¢Â¤Â´" },
      { label: "Save to profile", icon: "Ã¢â„¢Â¡" },
      { label: "Private save", icon: "Ã°Å¸â€â€™" },
      { label: "Copy link", icon: "Ã¢â€ â€”" },
      { label: "Report bracket", icon: "!" },
    ].map((action) => (
      <TouchableOpacity
        key={action.label}
        className={`mb-2 rounded-xl px-4 py-4 ${
          action.label === "Report bracket"
            ? "bg-red-50 dark:bg-red-950"
            : "bg-gray-50 dark:bg-gray-800"
        }`}

onPress={async () => {
  // Guard against the selected bracket changing or being dismissed.
  if (!selectedBracket) return;

  // TASK 11: Follow the creator of the selected bracket.
  if (action.label === "Follow creator") {
    // Authentication is required to create a follow relationship.
    if (!session?.user?.id) {
      setFollowFeedback({
        type: "error",
        message: "Please sign in to follow creators.",
      });
      return;
    }

    // A user must not be able to follow their own account.
    if (session.user.id === selectedBracket.creator_id) {
      setFollowFeedback({
        type: "error",
        message: "You cannot follow yourself.",
      });
      return;
    }

    setFollowLoading(true);
    setFollowFeedback(null);

    try {
      // Insert the authenticated follower and the bracket's creator.
      const { error: followInsertError } = await supabase
        .from("user_followers")
        .insert({
          follower_id: session.user.id,
          following_id: selectedBracket.creator_id,
        });

      if (followInsertError) {
        // PostgreSQL 23505 means the composite key already exists.
        if (followInsertError.code === "23505") {
          setFollowFeedback({
            type: "error",
            message: "You already follow this creator.",
          });
        } else {
          console.error(
            "[Task 11 / Follow Creator] Database insert failed:",
            followInsertError
          );

          setFollowFeedback({
            type: "error",
            message:
              followInsertError.message ||
              "Could not follow this creator.",
          });
        }

        return;
      }

      // Confirm success only after Supabase accepts the insert.
      setFollowFeedback({
        type: "success",
        message: "You are now following this creator.",
      });
    } catch (followUnexpectedError: unknown) {
      console.error(
        "[Task 11 / Follow Creator] Unexpected error:",
        followUnexpectedError
      );

      setFollowFeedback({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setFollowLoading(false);
    }

    return;
  }

  // Preserve the existing copy-link and in-app navigation feature.
  if (action.label === "Copy link") {
    const bracketLink = `brackets://bracket/${selectedBracket.id}`;

    try {
      await Clipboard.setStringAsync(bracketLink);
      setSelectedBracket(null);
      router.push(`/bracket/${selectedBracket.id}`);
    } catch (copyLinkError: unknown) {
      console.error(
        "[Bracket Menu / Copy Link] Clipboard operation failed:",
        copyLinkError
      );

      setFollowFeedback({
        type: "error",
        message: "Could not copy the bracket link.",
      });
    }

    return;
  }

  // Other viewer actions remain placeholders until implemented.
  console.log(
    `[Bracket Menu] Viewer action: ${action.label}; ` +
      `bracket ID: ${selectedBracket.id}`
  );

  setSelectedBracket(null);
}}

        /* TASK 11: Prevent repeated follow requests while processing. */
        disabled={action.label === "Follow creator" && followLoading}

        accessibilityRole="button"
        accessibilityLabel={action.label}
      >
        <Text
          className={`font-medium ${
            action.label === "Report bracket"
              ? "text-red-700 dark:text-red-300"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {action.icon}{" "}
{action.label === "Follow creator" && followLoading
  ? "Following..."
  : action.label}
        </Text>
      </TouchableOpacity>
    ))}
  </>
)
}

            <TouchableOpacity
              className="mt-3 items-center rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700"
              onPress={() => setSelectedBracket(null)}
            >
              <Text className="font-medium text-gray-700 dark:text-gray-200">
                Close
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    )}
  </View>
</Modal>

    </View>
  );
}
