const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "accept",
    aliases: ['acp'],
    version: "1.2",
    author: "siyuuuu",
    countDown: 8,
    role: 2,
    shortDescription: "Accept users",
    longDescription: "Accept users with name, ID, timestamp and link",
    category: "Utility",
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;
    const args = event.body.replace(/ +/g, " ").toLowerCase().split(" ");

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
      return api.sendMessage("Please select <add | del> <target number | or \"all\">", event.threadID, event.messageID);
    }

    let targetIDs = args.slice(1);

    if (args[1] === "all") {
      targetIDs = [];
      for (let i = 1; i <= listRequest.length; i++) targetIDs.push(i);
    }

    const newTargetIDs = [];
    const promiseFriends = [];

    for (const stt of targetIDs) {
      const u = listRequest[parseInt(stt) - 1];
      if (!u) {
        failed.push(`Can't find stt ${stt} in the list`);
        continue;
      }
      form.variables.input.friend_requester_id = u.node.id;
      form.variables = JSON.stringify(form.variables);
      newTargetIDs.push(u);
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
      form.variables = JSON.parse(form.variables);
    }

    for (let i = 0; i < newTargetIDs.length; i++) {
      try {
        const friendRequest = await promiseFriends[i];
        if (JSON.parse(friendRequest).errors) {
          failed.push(newTargetIDs[i].node.name);
        } else {
          success.push(newTargetIDs[i].node.name);
        }
      } catch (e) {
        failed.push(newTargetIDs[i].node.name);
      }
    }

    if (success.length > 0) {
      api.sendMessage(
        `✅ ${args[0] === 'add' ? 'Friend requests sent for' : 'Friend requests deleted for'} ${success.length} user(s):\n\n` +
        success.map(name => `• ${name}`).join("\n") +
        (failed.length > 0 ? `\n\n❌ Errors for ${failed.length} user(s):\n` + failed.map(name => `• ${name}`).join("\n") : ""),
        event.threadID,
        event.messageID
      );
    } else {
      api.unsendMessage(messageID);
      return api.sendMessage("Invalid response. Please provide a valid response.", event.threadID);
    }

    api.unsendMessage(messageID);
  },

  onStart: async function ({ event, api, commandName }) {
    const form = {
      av: api.getCurrentUserID(),
      fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
      fb_api_caller_class: "RelayModern",
      doc_id: "4499164963466303",
      variables: JSON.stringify({ input: { scale: 3 } })
    };

    const listRequest = JSON.parse(await api.httpPost("https://www.facebook.com/api/graphql/", form)).data.viewer.friending_possibilities.edges;

    if (!listRequest.length) return api.sendMessage("No pending friend requests found.", event.threadID);

    let msg = "📋 Pending Friend Requests:\n\n";
    listRequest.forEach((user, i) => {
      msg += `📌 ${i + 1}. Name: ${user.node.name}\n`;
      msg += `🆔 ID: ${user.node.id}\n`;
      msg += `🔗 Link: ${user.node.url}\n`;
      msg += `🕒 Time: ${moment(user.time * 1000).tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss")}\n\n`;
    });

    api.sendMessage(
      `${msg}Reply to this message with: <add | del> <number | "all">`,
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
