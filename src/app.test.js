//jest testing
const $ = require("axios")
//const {send} = require("./app.js")

test("Unauthorized 401 empty payload",() => {
  $.post("http://localhost:3000/webhook",{
    //object: "page"
  })
  .catch(e => {
    expect(e.response.data)
    .toEqual("Unauthorized")
  })
})

test("Bad Request 400 missing entry array",() => {
  $.post("http://localhost:3000/webhook",{
    object: "page"
  })
  .catch(e => {
    expect(e.response.data)
    .toEqual("Bad Request")
  })
})

test("Bad Request 400 entry is not an array",() => {
  $.post("http://localhost:3000/webhook",{
    object: "page",
    entry: "hello world"
  })
  .catch(e => {
    expect(e.response.data)
    .toEqual("Bad Request")
  })
})

test("Bad Request 400 entry array is empty",() => {
  $.post("http://localhost:3000/webhook",{
    object: "page",
    entry: []
  })
  .catch(e => {
    expect(e.response.data)
    .toEqual("Bad Request")
  })
})

test("Bad Request 400 if entry.messaging is empty",() => {
  $.post("http://localhost:3000/webhook",{
    object: "page",
    entry: [
      {
        messaging: []
      }
    ]
  })
  .catch(e => {
    expect(e.response.data)
    .toEqual("Bad Request")
  })
})

test("Bad Request 400 if user object has missing values",() => {
  $.post("http://localhost:3000/webhook",{
    object: "page",
    entry: [
      {
        messaging: [
          {
            sender: "hello world",
            message: null
          }
        ]
      }
    ]
  })
  .catch(e => {
    expect(e.response.data)
    .toEqual("Bad Request")
  })
})

test("Bad Request 400 when entry values has different type",() => {
  $.post("http://localhost:3000/webhook",{
    object: "page",
    entry: [
      {
        messaging: [
          {
            sender: {
              id: "hello world"
            },
            message: {
              text: 123
            }
          }
        ]
      }
    ]
  })
  .then(e => {
    expect(e.data)
    .toEqual("EVENT_RECEIVED")
  })
  .catch(e => {
    expect(e.response.data)
    .toEqual("Bad Request")
  })
})

test("get EVENT_RECEIVED when request has no flaw",() => {
  $.post("http://localhost:3000/webhook",{
    object: "page",
    entry: [
      {
        messaging: [
          {
            sender: {
              id: 7486938981385276
            },
            message: {
              text: "nodejs"
            }
          }
        ]
      }
    ]
  })
  .then(e => {
    expect(e.data)
    .toEqual("EVENT_RECEIVED")
  })
  .catch(e => {
    expect(e.response.data)
    .toEqual("Bad Request")
  })
})
