/* Basic push service worker for receiving push messages and showing notifications */
self.addEventListener('push', function(event) {
  let data = {}
  try { data = event.data.json() } catch (e) { data = { title: 'Notification', body: event.data?.text() || '' } }

  const title = data.title || 'Atelier'
  const options = {
    body: data.body || '',
    data: data,
    icon: '/favicon.ico'
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = '/account/orders'
  event.waitUntil(clients.openWindow(url))
})
