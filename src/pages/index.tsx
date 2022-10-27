import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { trpc } from "../utils/trpc";

const Home = () => {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("");
  const ctx = trpc.useContext();
  const postMessage = trpc.guestbook.postMessage.useMutation({
    onMutate: () => {
      ctx.guestbook.getAll.cancel();

      const optimisticUpdate = ctx.guestbook.getAll.getData();

      if (optimisticUpdate) {
        ctx.guestbook.getAll.setData(optimisticUpdate);
      }
    },
    onSettled: () => {
      ctx.guestbook.getAll.invalidate();
    },
  });

  if (status === "loading") {
    return <main className="flex flex-col items-center pt-4">Loading...</main>;
  }

  return (
    <main className="flex flex-col items-center">
      <h1 className="pt-4 text-3xl">Guestbook</h1>
      <p>
        Tutorial for <code>create-t3-app</code>
      </p>

      <div className="pt-10">
        {session ? (
          <div>
            <p>hi {session.user?.name}</p>

            <button onClick={() => signOut()}>Logout</button>

            <div className="pt-6">
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();

                  postMessage.mutate({
                    name: session.user?.name as string,
                    message,
                  });

                  setMessage("");
                }}
              >
                <input
                  type="text"
                  value={message}
                  placeholder="Your message..."
                  maxLength={100}
                  onChange={(event) => setMessage(event.target.value)}
                  className="rounded-md border-2 border-zinc-800 bg-neutral-900 px-4 py-2 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-md border-2 border-zinc-800 p-2 focus:outline-none"
                >
                  Submit
                </button>
              </form>
            </div>

            <div className="pt-10">
              <Messages />
            </div>
          </div>
        ) : (
          <div>
            <button onClick={() => signIn("discord")}>
              Login with Discord
            </button>

            <div className="pt-10" />
            <Messages />
          </div>
        )}
      </div>
    </main>
  );
};

const Messages = () => {
  const ctx = trpc.useContext();
  const { data: messages, isLoading } = trpc.guestbook.getAll.useQuery();
  const deleteMessage = trpc.guestbook.deleteMessage.useMutation({
    onMutate: (msgId) => {
      ctx.guestbook.getAll.setData(messages?.filter(msg => msg.id !== msgId));
    },
  });

  if (isLoading) return <div>Fetching messages...</div>;

  return (
    <div className="flex flex-col gap-4">
      {messages?.map((msg, index) => {
        return (
          <div key={index} className="flex items-start justify-between">
            <div>
              <p>{msg.message}</p>
              <span className="text-purple-300">- {msg.name}</span>
            </div>
            <button
              onClick={() => deleteMessage.mutate(msg.id)}
              className="h-10 w-10 rounded-md bg-purple-300 font-bold text-gray-900 hover:bg-purple-200"
            >
              x
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Home;
