"use strict";
const CLIENT_ID = 'xxUp2yytQvBmr0PyRlp2fE3hF8KQGlEZnzTB7Zi8bvA';
const CLIENT_SECRET = 'plK2QqAe3DY1PmCn-95CS-x0i1DZs7PdAjywCJFh_7Q';
async function login() {
    // curl -X POST \
    let auth_code = "EkhEQCAhyub6G6QvPE6xTbWIKNZOKdW7JyhklFGS6bE";
    let form_params = new Map([
        ['client_id', CLIENT_ID],
        ['client_secret', CLIENT_SECRET],
        ['redirect_uri', 'urn:ietf:wg:oauth:2.0:oob'],
        ['grant_type', 'authorization_code'],
        ['code', auth_code],
        ['scope', 'read write follow push']
    ]);
    const form = new FormData();
    for (const [key, value] of form_params) {
        form.set(key, value);
    }
    let response = await fetch('https://mastodon.gamedev.place/oauth/token', { method: 'POST', body: form });
    console.log(await response.json());
}

async function getArray(url:string, access_token:string) {

    let allEntries:any = [];

    let link:string = url;
    for (let i=0; i<20; i++) {
        link.includes('?')?link+='&':link+='?'
    
        let response = await fetch(`${link}limit=40`, {method:'GET', headers:{'Authorization': `Bearer ${access_token}`}});

        let entries = await response.json()

        console.log(entries);
        allEntries = [...allEntries, ...entries];
        let nextLink = response.headers.get('link')?.split(',')[0].split(';')[0].replace('<', '').replace('>', '');
        if (!nextLink) {
            throw new Error(`Couldn't get next link`);
        }
        link = nextLink;
        console.log(nextLink);
    }

    return allEntries;
}

async function notifications(access_token:string) {
    let allNotifications = await getArray('https://mastodon.gamedev.place/api/v1/notifications', access_token);
    // notifications.headers.forEach(console.log);

    let content_div = document.getElementById('content');

    if (!content_div) {
        throw new Error(`Couldn't find content div`);
    }
    

    for (const notif of allNotifications) {
        let entry = document.createElement('div');
        entry.classList.add('entry');

        let reply = notif.status?.in_reply_to_id;

        // let mentions =[];
        // for (let mention in notif.status?.mentions) {
        //     const {username, url} = mention as any;
        //     mentions.push({username, url})
        // }

        let mentions = notif.status?.mentions?.map(
            (m:any)=>{
                return {username:m.username, url:m.url}
            });


        let profile = null;
        if (notif.type == 'mention') {
            profile = notif.account;
        }

        entry.innerHTML = `${notif.type}
        <br>
        ${profile?`<img style="border-radius:50%" width="48px" height="48px" src=${profile.avatar}>`:''}
        ${reply?`<span class="desat">replying to </span>${mentions.map((m:any)=>{return `<a href="${m.url}">@${m.username}</a>`}).join(' ')}`:''}
        ${notif.status?.content}`
        // entry.innerHTML += JSON.stringify(notif, null, 2);
        content_div.appendChild(entry);
    }
}

function scorePost(post:any) {
    
    let favourites = post.favourites_count;
    let reblogs = post.reblogs_count;
    let replies = post.replies_count;
    
    let isReblog = post.reblog !== null;
    if (isReblog) {
        reblogs += post.reblog.reblogs_count;
        replies += post.reblog.replies_count;
        favourites += post.reblog.favourites_count;

    }

    return favourites + reblogs + replies;
}

async function home(access_token:string) {
    let timeline:any[] = await getArray('https://mastodon.gamedev.place/api/v1/timelines/home', access_token);



    timeline.sort((a, b)=>{return scorePost(b) - scorePost(a)});

    console.log(timeline);

    let content_div = document.getElementById('content');

    if (!content_div) {
        throw new Error(`Couldn't find content div`);
    }
    

    for (let notif of timeline) {
        let entry = document.createElement('div');
        entry.classList.add('entry');

        let isReblog = notif.reblog !== null;

        if (isReblog) {
            notif = notif.reblog;
        }

        let reply = notif.status?.in_reply_to_id;

        // let mentions =[];
        // for (let mention in notif.status?.mentions) {
        //     const {username, url} = mention as any;
        //     mentions.push({username, url})
        // }

        let mentions = notif.status?.mentions?.map(
            (m:any)=>{
                return {username:m.username, url:m.url}
            });

        let account = notif.account;
        entry.innerHTML += `${account?`<img style="border-radius:50%" width="48px" height="48px" src=${account.avatar}>`:''}`

        entry.innerHTML += `${notif.content}`;
        entry.innerHTML += `<br>💬${notif.replies_count} ♻️${notif.reblogs_count} ⭐️${notif.favourites_count}`

        for (let attachment of notif.media_attachments) {
            switch (attachment.type) {
                case 'image':
                    entry.innerHTML += `<img width="504px" src="${attachment.url}">`
                    break;
                case 'gifv':
                    entry.innerHTML += `<video width="504px" src="${attachment.url}" loop muted autoplay></video>`
                    break;
            }
        }

        entry.innerHTML += `<br><a class="entry_content" href="http://mastodon.gamedev.place/@${notif.account.acct}/${notif.id}" target="_blank">original post</a>`;
        // ${reply?`<span class="desat">replying to </span>${mentions.map((m:any)=>{return `<a href="${m.url}">@${m.username}</a>`}).join(' ')}`:''}
        // ${notif.status?.content}`
        // // entry.innerHTML += JSON.stringify(notif, null, 2);
        content_div.appendChild(entry);
    }

}

async function local(access_token:string) {
    let timeline:any[] = await getArray('https://mastodon.gamedev.place/api/v1/timelines/public?local=true', access_token);



    timeline.sort((a, b)=>{return scorePost(b) - scorePost(a)});

    console.log(timeline);

    let content_div = document.getElementById('content');

    if (!content_div) {
        throw new Error(`Couldn't find content div`);
    }
    

    for (let notif of timeline) {
        let entry = document.createElement('div');
        entry.classList.add('entry');

        let isReblog = notif.reblog !== null;

        if (isReblog) {
            notif = notif.reblog;
        }

        let reply = notif.status?.in_reply_to_id;

        // let mentions =[];
        // for (let mention in notif.status?.mentions) {
        //     const {username, url} = mention as any;
        //     mentions.push({username, url})
        // }

        let mentions = notif.status?.mentions?.map(
            (m:any)=>{
                return {username:m.username, url:m.url}
            });

        let account = notif.account;
        entry.innerHTML += `${account?`<img style="border-radius:50%" width="48px" height="48px" src=${account.avatar}>`:''}`

        entry.innerHTML += `${notif.content}`;
        entry.innerHTML += `<br>💬${notif.replies_count} ♻️${notif.reblogs_count} ⭐️${notif.favourites_count}`

        for (let attachment of notif.media_attachments) {
            switch (attachment.type) {
                case 'image':
                    entry.innerHTML += `<img width="504px" src="${attachment.url}">`
                    break;
                case 'gifv':
                case 'video':
                    entry.innerHTML += `<video width="504px" src="${attachment.url}" loop muted autoplay></video>`
                    break;
            }
        }

        entry.innerHTML += `<br><a class="entry_content" href="http://mastodon.gamedev.place/@${notif.account.acct}/${notif.id}" target="_blank">original post</a>`;
        // ${reply?`<span class="desat">replying to </span>${mentions.map((m:any)=>{return `<a href="${m.url}">@${m.username}</a>`}).join(' ')}`:''}
        // ${notif.status?.content}`
        // // entry.innerHTML += JSON.stringify(notif, null, 2);
        content_div.appendChild(entry);
    }

}

async function tag(access_token:string, tag:string) {
    let timeline:any[] = await getArray(`https://mastodon.gamedev.place/api/v1/timelines/tag/:${tag}` , access_token);

    let first = true;

    timeline.sort((a, b)=>{return scorePost(b) - scorePost(a)});

    console.log(timeline);

    let content_div = document.getElementById('content');

    if (!content_div) {
        throw new Error(`Couldn't find content div`);
    }
    

    for (let notif of timeline) {
        let entry = document.createElement('div');
        entry.classList.add('entry');

        let isReblog = notif.reblog !== null;

        if (isReblog) {
            notif = notif.reblog;
        }

        let reply = notif.status?.in_reply_to_id;

        // let mentions =[];
        // for (let mention in notif.status?.mentions) {
        //     const {username, url} = mention as any;
        //     mentions.push({username, url})
        // }

        let mentions = notif.status?.mentions?.map(
            (m:any)=>{
                return {username:m.username, url:m.url}
            });

        let account = notif.account;
        entry.innerHTML += `${account?`<img style="border-radius:50%" width="48px" height="48px" src=${account.avatar}>`:''}`

        entry.innerHTML += `${notif.content}`;
        entry.innerHTML += `<br>💬${notif.replies_count} ♻️${notif.reblogs_count} ⭐️${notif.favourites_count}`

        for (let attachment of notif.media_attachments) {
            switch (attachment.type) {
                case 'image':
                    entry.innerHTML += `<img width="504px" src="${attachment.url}">`
                    break;
                case 'gifv':
                case 'video':
                    entry.innerHTML += `<video width="504px" src="${attachment.url}" loop muted autoplay></video>`
                    break;
            }
        }

        entry.innerHTML += `<br><a class="entry_content" href="http://mastodon.gamedev.place/@${notif.account.acct}/${notif.id}" target="_blank">original post</a>`;

        // if (first) {
        
        //     entry.innerHTML += `<iframe src="https://www.lexaloffle.com/bbs/widget.php?pid=pavilion_picolake_1" allowfullscreen width="621" height="513" style="border:none; overflow:hidden"></iframe>`;
        //     // entry.innerHTML += `<iframe frameborder="0" allowfullscreen="true" scrolling="no" src="https://v6p9d9t4.ssl.hwcdn.net/html/6528652/index.html" allowtransparency="true" webkitallowfullscreen="true" id="game_drop" msallowfullscreen="true" allow="autoplay; fullscreen *; geolocation; microphone; camera; midi; monetization; xr-spatial-tracking; gamepad; gyroscope; accelerometer; xr; cross-origin-isolated" mozallowfullscreen="true"></iframe>`
        //     // entry.innerHTML += `<iframe width="320" height="180" frameborder="0" src="https://www.shadertoy.com/embed/MltXzN?gui=true&t=10&paused=false&muted=true" allowfullscreen></iframe>`
        //     first = false;
        // }
        // ${reply?`<span class="desat">replying to </span>${mentions.map((m:any)=>{return `<a href="${m.url}">@${m.username}</a>`}).join(' ')}`:''}
        // ${notif.status?.content}`
        // // entry.innerHTML += JSON.stringify(notif, null, 2);
        content_div.appendChild(entry);
    }

}

//<iframe width="320" height="180" frameborder="0" src="https://www.shadertoy.com/embed/MltXzN?gui=true&t=10&paused=false&muted=false" allowfullscreen></iframe>

async function main() {
    // login();
    const access_token = 'ZFH4hFxQAnY3PCd7dzuZStWsmodsl-9ybcV5NqiwLkg';
    // await notifications(access_token);
    await local(access_token);
    // await tag(access_token, 'pico8');

    // let response = await fetch('https://mastodon.gamedev.place/api/v1/accounts/verify_credentials', {method:'GET', headers:{'Authorization': `Bearer ${access_token}`}});
    // let user = await response.json();

    // console.log(user);


   
    // let followers = await fetch('')

    // -H 'Authorization: Bearer our_access_token_here' \
	// https://mastodon.example/api/v1/apps/verify_credentials
}

main();
// "https://mastodon.gamedev.place/oauth/authorize?client_id=xxUp2yytQvBmr0PyRlp2fE3hF8KQGlEZnzTB7Zi8bvA&scope=read+write+follow+push&redirect_uri=urn:ietf:wg:oauth:2.0:oob&response_type=code";
