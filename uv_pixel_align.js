
(function() {

    let button_x;
    let button_y;
    let button_both;
    let toggle_center;
    let center_toggled = false;

    function roundFloat(value, toNearest, fixed){
        return (Math.round(value / toNearest) * toNearest).toFixed(fixed);
      }

    function align(align_x, align_y) {
        let elements = UVEditor.getMappableElements();
        Undo.initEdit({elements, uv_only: true})
        for (let element of elements) {
            let selected_vertices = element instanceof Mesh && element.getSelectedVertices();
            
            let x = 0;
            let y = 0;
            let seen_verts = [];
            for (let fkey of  UVEditor.selected_faces) {
                let face = element.faces[fkey];
                if (element instanceof Mesh) { 
                    if (selected_vertices.length == 0) return Undo.finishEdit('Snap UV to pixel grid');
                    
                    for (let vkey of face.vertices) {
                        if ((!selected_vertices.length || selected_vertices.includes(vkey) && !seen_verts.includes(vkey)) && face.uv[vkey]) {
                            x += face.uv[vkey][0] / selected_vertices.length;
                            y += face.uv[vkey][1] / selected_vertices.length;
                            seen_verts.push(vkey)
                        }
                    }
                } else if (element instanceof Cube) {
                    x = face.uv[0];
                    y = face.uv[1];
                }
            }
            
            let dX = roundFloat(x, .25, 2) - x;
            let dY = roundFloat(y, .25, 2) - y;

            if (center_toggled) {
                let xs = (Math.sign(dX) == 0) ? 1 : Math.sign(dX);
                let ys = (Math.sign(dY) == 0) ? 1 : Math.sign(dY);
                dX += -xs * (.25 / 2)
                dY += -ys * (.25 / 2)
            }
    
            UVEditor.selected_faces.forEach(fkey => {
                if (!element.faces[fkey]) return;
                let face = element.faces[fkey];
                if (element instanceof Mesh) {
                    face.vertices.forEach(vkey => {
                        if (face.uv[vkey]) {
                            if (align_x) face.uv[vkey][0] = Math.clamp(face.uv[vkey][0]+dX, 0, UVEditor.getUVWidth());
                            if (align_y) face.uv[vkey][1] = Math.clamp(face.uv[vkey][1]+dY, 0, UVEditor.getUVHeight());
                        }
                    })
                } else if (element instanceof Cube) {
                    face.uv[0] = Math.clamp(face.uv[0]+dX, 0, UVEditor.getUVWidth());
                    face.uv[1] = Math.clamp(face.uv[1]+dY, 0, UVEditor.getUVHeight());
                    face.uv[2] = Math.clamp(face.uv[2]+dX, 0, UVEditor.getUVWidth());
                    face.uv[3] = Math.clamp(face.uv[3]+dY, 0, UVEditor.getUVHeight());
                }
            })
            element.preview_controller.updateUV(element);
        }
        UVEditor.loadData();
        Undo.finishEdit('Align UV to pixel grid')
    }

    BBPlugin.register('uv_pixel_align', {
        title: 'UV Pixel Align',
        author: 'Onusai',
        icon: 'grid_goldenratio',
        description: 'Align UV',
        version: '1.0.0',
        variant: 'desktop',
        
        onload() {
            button_x = new Action('uv_pixel_align_x', {
                icon: 'grid_goldenratio',
                color: 'x',
                name: 'UV Pixel Align X',
                category: 'uv',
                condition: () => UVEditor.isFaceUV() && UVEditor.hasElements(),
                click: function (event) {
                        align(true, false)
                }
            })
            button_y = new Action('uv_pixel_align_y', {
                icon: 'grid_goldenratio',
                color: 'y',
                name: 'UV Pixel Align Y',
                category: 'uv',
                condition: () => UVEditor.isFaceUV() && UVEditor.hasElements(),
                click: function (event) {
                        align(false, true)
                }
            })
            button_both = new Action('uv_pixel_align_both', {
                icon: 'grid_goldenratio',
                name: 'UV Pixel Align XY',
                category: 'uv',
                condition: () => UVEditor.isFaceUV() && UVEditor.hasElements(),
                click: function (event) {
                        align(true, true)
                }
            })
            toggle_center = new Action("uv_pixel_align_center",{
                icon: 'close_fullscreen',
                name: 'UV Pixel Align Center Toggle',
                category: 'uv',
                condition: () => UVEditor.isFaceUV() && UVEditor.hasElements(),
                click: function (event) {
                    center_toggled = !center_toggled;
                }
            })
            MenuBar.addAction(button_x, 'uv');
            MenuBar.addAction(button_y, 'uv');
            MenuBar.addAction(button_both, 'uv');
            MenuBar.addAction(toggle_center, 'uv');
            
        },
        onunload() {
            button_x.delete();
            button_y.delete();
            button_both.delete();
            toggle_center.delete();
        }
    });

})();