-- EPUB only: prefixes chapter titles with "Capítulo N" and labels the action boxes.
function Header(h)
  local num = h.attributes["data-num"]
  if h.level == 1 and num then
    local label = "Capítulo " .. num
    if h.attributes["data-pilar"] then
      label = label .. " · " .. h.attributes["data-pilar"]
    end
    h.content:insert(1, pandoc.LineBreak())
    h.content:insert(1, pandoc.Span(pandoc.Str(label), {class = "kicker"}))
  end
  return h
end
