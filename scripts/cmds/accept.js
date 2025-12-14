const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "accept",
    aliases: ["acp"],
    version: "1.3",
    author: "siyuuuu",
    countDown: 8,
    role: 2,
    shortDescription: "Accept users",
    longDescription: "Accept users with list, count and auto accept system",
    category: "Utility",
  },

  // ================= ON REPLY =================
  onReply: async function ({ message, Reply, event, api }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;

    const args = event.body.toLowerCase().trim().split(/\s+/);
    clearTimeout(Reply.unsendTimeout);

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.round(Math.random() * 19).toString()
        },
        scale: 3,
        refresh_num: 0
      }
    };

    const success = [];
    const failed = [];

    if (args[0] === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    } else if (args[0] === "del") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    } else {
      return api.sendMessage(
        "❌ Use: add | del <number | all>",
        event.threadID,
        event.messageID
      );
    }

    let targetIDs = args.slice(1);

    if (args[1] === "all") {
      targetIDs = listRequest.map((_, i) => i + 1);
    }

    const promiseFriends = [];
    const newTargets = [];

    for (const stt of targetIDs) {
      const u = listRequest[parseInt(stt) - 1];
      if (!u) {
        failed.push(`STT ${stt}`);
        continue;
      }

      form.variables.input.friend_requester_id = u.node.id;
      form.variables = JSON.stringify(form.variables);
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
      newTargets.push(u);
      form.variables = JSON.parse(form.variables);
    }

    for (let i = 0; i < newTargets.length; i++) {
      try {
        const res = await promiseFriends[i];
        if (JSON.parse(res).errors) {
          failed.push(newTargets[i].node.name);
        } else {
          success.push(newTargets[i].node.name);
        }
      } catch {
        failed.push(newTargets[i].node.name);
      }
    }

    api.unsendMessage(messageID);

    return api.sendMessage(
      `✅ Success: ${success.length}\n❌ Failed: ${failed.length}`,
      event.threadID
    );
  },

  // ================= ON START =================
  onStart: async function ({ event, api, args, commandName }) {

    const form = {
      av: api.getCurrentUserID(),
      fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
      fb_api_caller_class: "RelayModern",
      doc_id: "4499164963466303",
      variables: JSON.stringify({ input: { scale: 3 } })
    };

    const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
    const listRequest = JSON.parse(res).data.viewer.friending_possibilities.edges;

    // ===== /acp list =====
    if (args[0] === "list" && !args[1]) {
      return api.sendMessage(
        `👥 Friend Requests: ${listRequest.length}`,
        event.threadID,
        event.messageID
      );
    }

    // ===== /acp list all =====
    if (args[0] === "list" && args[1] === "all") {
      if (!listRequest.length)
        return api.sendMessage("No pending friend requests.", event.threadID);

      const formAccept = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestConfirmMutation",
        fb_api_caller_class: "RelayModern",
        doc_id: "3147613905362928",
        variables: {}
      };

      for (const user of listRequest) {
        formAccept.variables = JSON.stringify({
          input: {
            source: "friends_tab",
            actor_id: api.getCurrentUserID(),
            friend_requester_id: user.node.id,
            client_mutation_id: Math.round(Math.random() * 19).toString()
          },
          scale: 3,
          refresh_num: 0
        });
        await api.httpPost("https://www.facebook.com/api/graphql/", formAccept);
      }

      return api.sendMessage(
        "✅ All complete and added to my friend list now",
        event.threadID
      );
    }

    // ===== DEFAULT LIST SHOW =====
    if (!listRequest.length)
      return api.sendMessage("No pending friend requests found.", event.threadID);

    let msg = "📋 Pending Friend Requests:\n\n";
    listRequest.forEach((u, i) => {
      msg += `📌 ${i + 1}. ${u.node.name}\n`;
      msg += `🆔 ${u.node.id}\n`;
      msg += `🔗 ${u.node.url}\n`;
      msg += `🕒 ${moment(u.time * 1000).tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss")}\n\n`;
    });

    api.sendMessage(
      `${msg}Reply with: add | del <number | all>`,
      event.threadID,
      (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          listRequest,
          author: event.senderID,
          unsendTimeout: setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, this.config.countDown * 1000)
        });
      },
      event.messageID
    );
  }
};
