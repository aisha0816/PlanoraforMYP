self.addEventListener("push", (event) => {
    let data = {
        title: "Planora Reminder",
        body: "You have a task coming up!",
        url: "/",
    };

    if (event.data) {
        try {
            data = {...data, ...event.data.json() };
        } catch (error) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: {
                url: data.url
            }
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.noficiation.data?.url || "/";

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then((windowClients) => {
            for (const client of windowClients) {
                if ("focus" in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }

            return clients.openWindow(url)
        })
    );
});
