import soundCloud from './sound-cloud'
import flatten from 'array-flatten'
import notify from './notifications'
import hogan from 'hogan.js'
import $ from './$'

var sc = soundCloud('739b39925c3cc275aeb03837ff27762c')

var getFriends = (username) => {
  // get userid from username
  sc.userID(username)
    // get last 50 favorite tracks
    .then(user => {
      notify(10, `fetching ${username}'s favorites`)
      return sc.favorites(user.id)
    })
    // get all the people who favorited those tracks
    .then(favorites => {
      notify(30, `finding other users`)
      let allfavs = favorites.map(f => f.id).map(sc.trackFavorites)
      return Promise.all(allfavs)
    })
    // assemble an array
    .then(favoriters => {
      notify(30, `comparing ${username} to other users`)

      favoriters = flatten(favoriters)
      let users = {}
      let hash = favoriters.map(f => f.id)

      hash.forEach((id, i) => {
        if (users[id]) {
          users[id].similarity += 1
        } else {
          users[id] = favoriters[i]
          users[id].similarity = 1
        }
      })

      let similarUsers = []
      let keys = Object.keys(users)
      .sort((a,b) => users[b].similarity - users[a].similarity)
      .slice(0, 20)
      .forEach((key) => {
        similarUsers.push(users[key])
      })

      notify(70, 'ranking users based on similarity')

      // compile template
      var $users = document.getElementById('users');
      var template = hogan.compile($users.innerHTML);
      $users.innerHTML = template.render({users: similarUsers});

    })
    .catch(err => console.error('Something went wrong', err))
}

$('.username-form').on('submit', (e) => {
  e.preventDefault()
  getFriends(document.getElementById('username').value)
})

// toggle info screen
$('.info-toggle').on('click', () => $('.info').toggleClass('is-active'));

