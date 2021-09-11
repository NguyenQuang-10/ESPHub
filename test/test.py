def route(url, f):
    print(url)
    f()
    # def decorator(f):
    #     f()
    # return decorator

@route('url_lmao')
def test():
    print("hello world")