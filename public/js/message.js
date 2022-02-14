const socket = io();
const OFFSET = 50

function loaded() {
    window.scrollTo(0, document.body.scrollHeight);
}

function sleep (ms) 
{
    return new Promise(resolve => setTimeout(resolve, ms))
}

function appendChildren (elem, children) 
{
    const appender = (res, child) => 
    {
        res.appendChild(child)
        return res
    }
    return children.reduce(appender, elem)
}

function appendAttrs (elem, attrs) 
{
    const appender = (res, attr) => 
    {
        res.setAttribute(attr[0], attr[1])
        return res
    }
    return Object.entries(attrs).reduce(appender, elem)
}

function createElem (tag, classes = [], children = [], attrs = {}) 
{
    let elem = document.createElement(tag)
    elem.classList = classes
    elem = appendAttrs(elem, attrs)
    return appendChildren(elem, children)
}

function updateGalleries (yesnt = false) 
{
    [...document.getElementsByClassName('images')]
        .forEach((gallery) => {
            const images = gallery.getAttribute('data').split(',')
            $(gallery).imagesGrid({
                images: images,
                align: true,
                cells: 5
            })
            if (yesnt){
                [gallery.getElementsByTagName('img')].forEach((image) => {
                    for (let i = 0; i < image.length; i ++)
                    {
                        image[i].setAttribute('onload', 'loaded()')
                    }
                })
            }
    })    
}

function genMessage(msg)
{
    const avatarImg = createElem('img', [], [], {src: msg.author.avatar})
    const avatar = createElem('div', ['avatar'], [avatarImg])

    const name = createElem('div', ['name'])
    name.innerText = msg.author.name

    const time = createElem('div', ['time'])
    var today = new Date(msg.time)
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); 
    var yyyy = today.getFullYear();
    var timeDate = today.toLocaleTimeString('ru-RU', { hour12: false, 
        hour: "numeric", 
        minute: "numeric"});
    today = timeDate + ' ' + mm + '.' + dd + '.' + yyyy;
    time.innerText = today

    const reply = createElem('button', ['reply'], [], {id: msg.id, onclick: "reply(this)"})
    reply.innerHTML = '<i style="font-size:14px" class="fa">&#xf112;</i>'
    const title = createElem('div', ['title'], [name, time, reply])

    const text = createElem('div', ['text'])
    text.innerText = msg.msg
    var images, content, replyMes
    if (msg.reply && msg.reply != {})
    {
        replyMes = genReplyMessage(msg.reply.name, msg.reply.time, msg.reply.text, msg.reply.id, msg.reply._id)
    }
    else
    {
        replyMes = ''
    }

    if (msg.images.length > 0)
    {
        images = createElem('div', ['images'], [], {data: msg.images})
        if (replyMes != '')
        {
            content = createElem('div', ['content'], [replyMes, text, images])
        }
        else
        {
            content = createElem('div', ['content'], [text, images])
        }
    }
    else
    {
        if (replyMes != '')
        {
            content = createElem('div', ['content'], [replyMes, text])
        }
        else
        {
            content = createElem('div', ['content'], [text])
        }
    }
    const right = createElem('div', ['rightCont'], [title, content])
    
    const shit = createElem('div', ['shit'], [avatar, right], {onmouseover: "showReply(this)", onmouseout: "hideReply(this)"})
    shit.id = msg._id

    return shit
}

function genReplyMessage(divName, divTime, divText, divId, div_Id, divImage = false, divClose = false)
{
    const name = createElem('div', ['nameReply'])
    name.innerText = divName
    name.style.display = "inline-block"

    const time = createElem('div', ['timeReply'])
    time.innerText = divTime
    time.style.display = "inline-block"
    time.style.marginLeft = "5px"

    const titleReply = divClose ? createElem('div', ['titleReply'], [name, time, divClose]) : createElem('div', ['titleReply'], [name, time])

    const text = createElem('div', ['textReply'])
    if (divText == '' && divImage)
    {
        text.innerText = 'Фотография'
    }
    else if (divText != '')
    {
        text.innerText = divText
    }
    else
    {
        text.innerText = 'Пусто'
    }
    const content = createElem('div', ['contentReply'], [text])
    content.style.marginLeft = "0px"
    const shit = divClose ? createElem('div', ['shitReply'], [titleReply, content]) : createElem('div', ['shitReply'], [titleReply, content], {onclick: "scrollToDiv(this.value)"})
    shit.value = {divId, div_Id}

    return shit
}

function closeReplyMessage()
{
    replyDiv = ''
    replyId = ''
    replyDisplay.innerHTML = ''
    replyDisplay.style.paddingTop = "0px"
}

async function renderMessage(shit, insert = false)
{
    const sewerage = document.getElementById('sewerage')
    if (insert)
    {
        sewerage.prepend(shit)
        updateGalleries() 
    }
    else
    {
        await sewerage.appendChild(shit)
        updateGalleries(true) 
        loaded()
    }
}

function loadLastMessages(token)
{
    const count = 20
    socket.emit('lastMessages', {token: token, count: count});
    socket.on('lastMessages callback', function(dataMes) 
    {
        let token = dataMes.token
        if (token == cookieData)
        {
            var data = dataMes.list
            for (let i = 0; i < data.length; i++)
            {
                renderMessage(genMessage(data[i]))
            }
            updateGalleries(true) 
            lever(OFFSET)
            loaded()
        }
    });
    
    
}

function lever (offset) 
{
    $(window).scroll(function () 
    {
        const 
        {
            scrollTop,
            scrollHeight,
            clientHeight
        } = document.documentElement

        const percent = scrollTop / (scrollHeight - clientHeight)
        if (percent <= 0.05) 
        {
            $(window).unbind('scroll')
            let lastid = Number($('.shit')[0].getElementsByClassName('reply')[0].id)
            let firstid = lastid - offset
            if (firstid < 0) { firstid = 0 }
            if (firstid == 0 && lastid == 1) { lastid += 1 }
            if (lastid != 0)
            {
                renderMessages(firstid, lastid)
            }
        }
    })
}

function renderMessages(firstid, lastid)
{
    socket.emit('loadMessages', firstid, lastid, cookieData);
    socket.on('loadMessages callback', function(data, token) 
    {
        if (token == cookieData)
        {
            var oldHeight = $(document).height()
            var oldScroll = $(window).scrollTop()

            for (let i = 0; i < data.length; i++)
            {
                renderMessage(genMessage(data[i]), true)
            }
            $(document).scrollTop(oldScroll + $(document).height() - oldHeight); 
            async function bounce () 
            {
                await sleep(500)
                lever(OFFSET)
            }
            
            bounce()
            updateGalleries()
        }
    });
}
