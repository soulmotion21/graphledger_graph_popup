// 최신버전
var dmUi = dmUi || {};
dmUi.view = dmUi.view || {};
dmUi.view.graph = function () {
};

dmUi.view.graph.prototype = {
  /**
   * User docs graph
   */
  drawGraph: function (url, userAgent) {

    d3.json(url).then(function (data) {
      var self = this;
      var force, svg, container, link, linkMarker, nodeGroup, node, icons,
        nodeLabel, textBackground, linkTextGroup, edgeLabels = null;
      var linkedByIndex = {};
      var oData = data.result[0];
      var sUserAgent = userAgent;
      var isIE = sUserAgent.indexOf('Trident');

      if (document.querySelector('._userGraph')) {
        var width = document.querySelector('.section_contents').clientWidth / 1.5;
        var height = 400;

        if (oData !== undefined) {
          d3.select("svg").remove();
          if (oData.length === 0 || oData.nodes.length === 0 && oData.links.length === 0) {
            self.showGraphEmpty(document.querySelector('._userGraph'));
          } else {
            document.querySelector('.box_zoom').style.display = 'block';
            // 1. base force layout setting
            force = d3.forceSimulation().alphaDecay(0.06).force('link', d3.forceLink().id(function (node) {
              return node.id;
            }).distance(120));
            force.nodes(oData.nodes).on('tick', tick);
            force.force('link').links(oData.links);
            force.force("charge_force", d3.forceManyBody().strength(-100));
            force.force('center', d3.forceCenter(width / 2, height / 2));
            force.force("xAxis", d3.forceX(width / 2).strength(0.04));
            force.force("yAxis", d3.forceY(height / 2).strength(0.06));
            force.force("collide", d3.forceCollide().radius(function (d) {
              return d.r * 20;
            }).iterations(10).strength(1));

            // 2. base SVG setting
            svg = d3.select('._userGraph').append('svg')
              .attr('xmlns', "=http://www.w3.org/2000/svg")
              .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
              .attr('preserveAspectRatio', 'none')
              .attr('viewBox', width / 4 + ' 60 ' + width / 2 + ' 250');

            container = svg.append("g");

            // zoom
            svg.call(d3.zoom().scaleExtent([.1, 4]).on("zoom", function () {
                container.attr("transform", d3.event.transform);
              })
            );

            // 3. Edge
            link = container.selectAll(".link")
              .data(oData.links).enter()
              .append('path').attr('class', 'link')
              .attr('data-index', function (links) {
                return links.index;
              }).attr("marker-end", function (links) {
                return "url(#" + links.target.id + ")";
              }).attr('fill', function () {
                return 'none';
              })
              .style('stroke', function (d) {
                switch (d.transaction.txAmount) {
                  case 'order':
                    return 'rgba(79,195,247,0.8)';
                  case 'order_detail':
                    return 'rgba(122,207,15,0.8)';
                  case 'product_detail':
                    return 'rgba(178,132,255,0.8)';
                  case 'settlement':
                    return 'rgba(255,162,0,0.8)';
                  default :
                    return 'rgba(145,146,155,0.8)';
                }
              }).attr("marker-end", function (d) {
                return "url(#" + d.target.id + ")";
              }).attr('stroke-dasharray', function (d) {
                if (d.source.type === 'cp' && d.target.type === 'product') {
                  return '1'
                } else {
                  return '';
                }
              }).attr('id', function (d, i) {
                return 'edgepath' + i
              });

            // 4. edge arrows
            linkMarker = container.append("defs").selectAll("marker")
              .data(oData.links).enter().append("marker").attr("id", function (d) {
                return d.target.id;
              }).attr('class', function (d) {
                return 'marker' + d.target.index;
              }).attr("viewBox", "0 -5 10 10")
              .attr("refX", 44) // 화살표 끝 지점 죄표
              .attr("refY", -0.5) // 화살표 끝 지점 좌표
              .attr("markerWidth", 6) // 화살표 크기
              .attr("markerHeight", 6) // 화살표 크기
              .attr("orient", "auto")
              .append("svg:path")
              .attr('fill', function (d) {
                switch (d.transaction.txAmount) {
                  case 'order':
                    return 'rgba(79,195,247,0.8)';
                  case 'order_detail':
                    return 'rgba(122,207,15,0.8)';
                  case 'product_detail':
                    return 'rgba(178,132,255,0.8)';
                  case 'settlement':
                    return 'rgba(255,162,0,0.8)';
                  default :
                    return 'rgba(145,146,155,0.8)';
                }

              }).attr("d", "M0,-5L10,0L0,5");

            // 5. node setting : nodes -> g
            nodeGroup = container.selectAll('.node-group')
              .data(oData.nodes).enter().append("g")
              .attr('data-index', function (d) {
                return d.index;
              }).on("mouseover", mouseOver(.1)).on("mouseout", mouseOut)
              .call(d3.drag().on("start", dragStarted).on("drag", dragged).on("end", dragEnded));

            node = nodeGroup.append('svg:circle').attr('class', function (d) {
              return 'node ' + 'node' + d.index;
            }).attr('r', function (d) {
              if (d.type === "me") {
                return '10';
              } else {
                return '10';
              }
            }).attr('fill', function (d) {
              var sType = d.type;
              switch (sType) {
                case "member":
                  return 'rgba(255,205,0,1)';
                case "order":
                  return 'rgba(79,195,247,1)';
                case "product":
                  return 'rgba(122,207,15,1)';
                case "cp":
                  return 'rgba(178,132,255,1)';
                case "settlement":
                  return 'rgba(255,162,0,1)';
                default :
                  return 'rgba(170,170,170,1)';
              }
            }).attr('stroke', function (d) {
              var sType = d.type;
              switch (sType) {
                case "member":
                  return 'rgba(210, 168, 0, 0.5)';
                case "order":
                  return 'rgba(0,154,211, 0.5)';
                case "product":
                  return 'rgba(13,177,0,0.5)';
                case "cp":
                  return 'rgba(116,112,249,0.5)';
                case "settlement":
                  return 'rgba(211, 134, 0, 0.5)';
                default :
                  return 'rgba(125,125,125,0.5)';
              }
            }).attr('stroke-width', function (d) {
              return '1.5';
            }).attr('stroke-position', 'center');

            // 6. Inserted node icon
            icons = nodeGroup.append('text', function (d) {
              if (d.sum !== undefined) {
                return '<tspan>' + d.id + '</tspan>';
              } else {
                return '<tspan>' + d.type + '</tspan>';
              }
            }).attr('x', function (d) {
              return -4;
            }).attr('y', function (d) {
              return -4;
            }).attr("dy", 3).attr('text-anchor', 'middle').on("mouseover", mouseOver(.2)).on("mouseout", mouseOut);
            // dy, 3

            icons.append('tspan').text(function (d) {
              if (d.sum !== undefined) {
                return d.id;
              } else {
                var textType = d.type;
                switch (textType) {
                  case "member":
                    return '회원';
                  case "order":
                    return '주문';
                  case "product":
                    return '상품';
                  case "cp":
                    return '판매자';
                  case "settlement":
                    return '정산';
                  default :
                    return textType;
                }
              }
            }).attr("x", 0).attr("dx", 0).attr("dy", 5).attr('text-anchor', 'middle');


            // 7. node text labels setting
            nodeLabel = nodeGroup.append("svg:text")
              .attr('class', function (node) {
                if (node.type === 'me') {
                  return 'node-label'
                } else {
                  return 'node-label';
                }
              }).attr('dy', function (d) {
                return '12';
              }).text(function (node) {
                if (node.sum !== undefined) {
                  return '정산금액 : ' + node.sum;
                } else {
                  if (node.name !== undefined) {
                    if (node.name.length > 0) {
                      if (node.name.length >= 30) { // 30
                        var sName = node.name.substr(0, 30);
                        return sName + '...';
                      } else {
                        return node.name;
                      }
                    } else {
                      return node.id
                    }
                  } else {
                    return node.id
                  }
                }
              }).call(self._getBBox);

            // 8. node text label background
            textBackground = nodeGroup.insert('svg:rect', 'text')
              .attr('x', function (d) {
                return d.bbox.x - 0.5
              }).attr('y', function (d) {
                if (isIE > -1) {
                  return d.bbox.y - 0.5;
                } else {
                  return d.bbox.y
                }

              }).attr('width', function (d) {
                return d.bbox.width + 1
              }).attr('height', function (d) {
                return d.bbox.height
              }).attr('class', function (d) {
                return 'bbox ' + 'node' + d.index;
              });

            // 9. edge text container
            linkTextGroup = container.selectAll('.link-text-group')
              .data(oData.links).enter().append("g")
              .attr('class', 'link-text-group')
              .attr('data-id', function (d) {
                return d.id
              }).attr('data-index', function (d) {
                return d.index
              });

            // 10. edge text
            edgeLabels = linkTextGroup.append('text')
              .attr('class', 'edgelabel')
              .attr('id', function (d, i) {
                return 'edgelabel' + i
              })
              .attr('dx', 35)
              .attr('dy', 5)
              .attr('font-size', 5)
              .style('fill', 'rgba(0,0,0,0.15)');

            // 11. Edge text path for edge degree
            edgeLabels.append('textPath')
              .attr('xlink:href', function (d, i) {
                return '#edgepath' + i
              }).text(function (d) {
              var sDate = d.transaction.date;
              var sYear = sDate.substr(0, 4);
              var sMonth = sDate.substr(4, 2);
              var sDay = sDate.substr(6, 2);
              var sHour = sDate.substr(8, 2);
              var sMin = sDate.substr(10, 2);
              var sSecond = sDate.substr(12, 2);

              return sYear + '-' + sMonth + '-' + sDay + ' ' + sHour + ':' + sMin + ':' + sSecond;
            });

            function dragStarted(d) {
              d3.event.sourceEvent.stopPropagation();
              if (!d3.event.active) force.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            }

            function dragged(d) {
              d.fx = d3.event.x;
              d.fy = d3.event.y;
            }

            function dragEnded(d) {
              if (!d3.event.active) force.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            }

            // force simulation ends
            function tick() {
              nodeGroup.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
              });

              link.attr("d", linkArc);

              edgeLabels.attr('transform', function (d) {
                if (d.target.x < d.source.x) {
                  var bbox = this.getBBox(); // this -> text
                  var rx = bbox.x + bbox.width / 2;
                  var ry = bbox.y + bbox.height / 2;
                  return 'rotate(180 ' + rx + ' ' + ry + ')';
                } else {
                  return 'rotate(0)';
                }

              });

              function linkArc(d) {
                var dx = d.target.x - d.source.x,
                  dy = d.target.y - d.source.y,
                  dr = Math.sqrt(dx * dx + dy * dy) * 14.65;

                return "M" + d.source.x + "," + d.source.y +
                  "A" + dr + "," + dr + " 0 0,1 " +
                  d.target.x + "," + d.target.y;
              }

              svg.selectAll(".node-group").on("mouseover", function () {
                var el = this.firstElementChild;
                this.parentNode.appendChild(this);
                addClass(el, 'active');
                this.childNodes[1].setAttribute('opacity', '1');
              });

              svg.selectAll(".node-group").on("mouseout", function () {
                var el = this.firstElementChild;
                this.parentNode.appendChild(this);
                removeClass(el, 'active');
              });

            } //tick


            // build a dictionary of nodes that are linked
            oData.links.forEach(function (d) {
              linkedByIndex[d.source.index + "," + d.target.index] = 1;
            });

            /**
             * Node connected check function
             * @param a : mouseover node
             * @param b : nodes
             * Mouseover node id match with nodes then return true or false
             * @returns {*|boolean}
             */
            function isConnected(a, b) {
              if (
                a.id.split('_')[1] !== undefined || //수정한 사람 노드 비교 추가
                b.id.split('_')[1] !== undefined
              ) {
                return linkedByIndex[a.index + "," + b.index] ||
                  linkedByIndex[b.index + "," + a.index] ||
                  a.index === b.index ||
                  a.id.split('_')[1] === b.id ||
                  a.id.split('_')[1] === b.id.split('_')[1];

              } else {
                return linkedByIndex[a.index + "," + b.index] ||
                  linkedByIndex[b.index + "," + a.index] ||
                  a.index === b.index ||
                  a.id.split('_')[1] === b.id;

              }

            }

            function mouseOver(opacity) {
              return function (d) {
                icons.attr("opacity", function (o) {
                  var thisOpacity = isConnected(d, o) ? 1 : opacity;
                  return thisOpacity;
                });

                nodeGroup.attr("opacity", function (o) {
                  var thisOpacity = isConnected(d, o) ? 1 : opacity;
                  return thisOpacity;
                });

                edgeLabels.attr("opacity", function (o) {
                  if (
                    o.source.id.split('_')[1] !== undefined ||
                    d.id.split('_')[1] !== undefined
                  ) {
                    if (
                      o.source.id === d.id.split('_')[1] ||
                      o.source === d || o.target === d ||
                      o.source.id.split('_')[1] === d.id.split('_')[1]
                    ) {
                      return '1';
                    } else {
                      return '0.15';
                    }
                  } else {
                    if (
                      o.source.id === d.id.split('_')[1] ||
                      o.source === d || o.target === d
                    ) {
                      return '1';
                    } else {
                      return '0.15';
                    }
                  }
                }).attr('font-size', function (o) {
                  if (
                    o.source.id.split('_')[1] !== undefined ||
                    d.id.split('_')[1] !== undefined
                  ) {
                    if (
                      o.source.id === d.id.split('_')[1] ||
                      o.source === d || o.target === d ||
                      o.source.id.split('_')[1] === d.id.split('_')[1]
                    ) {
                      return '5';
                    } else {
                      return '4';
                    }
                  } else {
                    if (
                      o.source.id === d.id.split('_')[1] ||
                      o.source === d || o.target === d
                    ) {
                      return '5';
                    } else {
                      return '4';
                    }
                  }
                }).style('fill', function (o) {
                  if (
                    o.source.id.split('_')[1] !== undefined ||
                    d.id.split('_')[1] !== undefined
                  ) {
                    if (
                      o.source.id === d.id.split('_')[1] ||
                      o.source === d || o.target === d ||
                      o.source.id.split('_')[1] === d.id.split('_')[1]
                    ) {
                      return 'rgba(0, 0, 0, 0.65)';
                    } else {
                      return 'rgba(0, 0, 0, 0.15)';
                    }
                  } else {
                    if (
                      o.source.id === d.id.split('_')[1] ||
                      o.source === d || o.target === d
                    ) {
                      return 'rgba(0, 0, 0, 0.65)';
                    } else {
                      return 'rgba(0, 0, 0, 0.65)';
                    }
                  }
                });

                link.attr("opacity", function (o) {
                  if (
                    o.source.id.split('_')[1] !== undefined ||
                    d.id.split('_')[1] !== undefined
                  ) {
                    if (
                      o.source.id === d.id.split('_')[1] ||
                      o.source === d || o.target === d ||
                      o.source.id.split('_')[1] === d.id.split('_')[1]
                    ) {
                      return '1';
                    } else {
                      return '0.1';
                    }
                  } else {
                    if (
                      o.source.id === d.id.split('_')[1] ||
                      o.source === d || o.target === d
                    ) {
                      return '1';
                    } else {
                      return '0.1';
                    }
                  }

                }).style('stroke', function (o) {
                  switch (o.transaction.txAmount) {
                    case 'order':
                      return 'rgba(79,195,247,0.8)';
                    case 'order_detail':
                      return 'rgba(122,207,15,0.8)';
                    case 'product_detail':
                      return 'rgba(178,132,255,0.8)';
                    case 'settlement':
                      return 'rgba(255,162,0,0.8)';
                    default :
                      return 'rgba(145,146,155,0.8)';
                  }

                }).style('stroke-width', function (o) {
                  if (
                    o.source.id.split('_')[1] !== undefined || //수정한 사람 노드 비교 추가
                    d.id.split('_')[1] !== undefined
                  ) {
                    if (
                      o.source.id === d.id.split('_')[1] ||
                      o.source === d || o.target === d ||
                      o.source.id.split('_')[1] === d.id.split('_')[1]
                    ) {
                      return '1';
                    } else {
                      return '0.4';
                    }
                  } else {
                    if (
                      o.source.id === d.id.split('_')[1] ||
                      o.source === d || o.target === d
                    ) {
                      return '1';
                    } else {
                      return '0.5';
                    }
                  }
                });

                linkMarker.attr('fill', function (d) {
                  switch (d.transaction.txAmount) {
                    case 'order':
                      return 'rgba(79,195,247,1)';
                    case 'order_detail':
                      return 'rgba(122,207,15,1)';
                    case 'product_detail':
                      return 'rgba(178,132,255,1)';
                    case 'settlement':
                      return 'rgba(255,162,0,1)';
                    default :
                      return 'rgba(145,146,155,1)';
                  }

                });

                svg.selectAll('marker').attr("refX", 26);

              };
            }

            function mouseOut() {
              nodeGroup.attr("opacity", 1);
              linkMarker.attr("opacity", 1).attr('fill', function (d) {
                switch (d.transaction.txAmount) {
                  case 'order':
                    return 'rgba(79,195,247,0.8)';
                  case 'order_detail':
                    return 'rgba(122,207,15,0.8)';
                  case 'product_detail':
                    return 'rgba(178,132,255,0.8)';
                  case 'settlement':
                    return 'rgba(255,162,0,0.8)';
                  default :
                    return 'rgba(145,146,155,0.8)';
                }
              });

              svg.selectAll('marker').attr("refX", 44);
              icons.attr("opacity", '1');
              edgeLabels.attr('font-size', '4').style('fill', 'rgba(0, 0, 0, 0.15)').attr('opacity', '1');

              link.attr("opacity", 1)
                .style('stroke', function (d) {
                  switch (d.transaction.txAmount) {
                    case 'order':
                      return 'rgba(79,195,247,0.8)';
                    case 'order_detail':
                      return 'rgba(122,207,15,0.8)';
                    case 'product_detail':
                      return 'rgba(178,132,255,0.8)';
                    case 'settlement':
                      return 'rgba(255,162,0,0.8)';
                    default :
                      return 'rgba(145,146,155,0.8)';
                  }
                }).style('stroke-width', '0.5');
            }

            // add, remove class
            function hasClass(el, className) {
              if (el.classList)
                return el.classList.contains(className);
              else
                return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
            }

            function addClass(el, className) {
              if (el.classList)
                el.classList.add(className);
              else if (!hasClass(el, className)) el.className += " " + className
            }

            function removeClass(el, className) {
              if (el.classList)
                el.classList.remove(className);
              else if (hasClass(el, className)) {
                var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
                el.className = el.className.replace(reg, ' ');
              }
            }

          }

        } else { // data undefined
          self.showGraphEmpty(document.querySelector('._userGraph'));
        }
      }
    });

  },
  showGraphEmpty: function (el) {
    document.querySelector('.box_zoom').style.display = 'none';
    el.innerHTML = '';
    el.innerHTML = '<p style="height: 751px;text-align: center; padding: 345px 0 0 0">' + '<span style="vertical-align: middle; font-size: 1.8rem; color: #8d97ad">' + ' No Data' + '</span>' + '</p>';
  },
  colorMix1: function (n) {
    var colors1 = [
      "rgba(255,205,0,1)", //1st
      "rgba(79,195,247,1)", //cp
      "rgba(0,220,190,1)", //order
      "rgba(153,169,251,1)" //product
    ];

    return colors1[n % colors1.length];
  },
  colorMix2: function (n) {
    var colors2 = [
      "#68bdf6", //user
      "#40c2de", //doc
      "#8db1f2" //doc_rev
    ];

    return colors2[n % colors2.length];
  },

  // text node getBBox for label background color
  _getBBox: function (selection) {
    selection.each(function (data) {
      data.bbox = this.getBBox();
    });
  }
};
