export function extractCoursesJson() {
    //console.log("Extracting courses...");

    // Course List
    var courses = getCoursesDiv_list();
    //console.log(courses);
    if (courses.length == 0) {
        alert("No courses found.");
        return;
    }

    var coursesInfo = [];
    courses.forEach(course => {

        var course_index = course.id.split("$")[1];

        // Course Info
        var courseName = course.querySelector("td.PAGROUPDIVIDER").innerText.trim();
        var status = document.getElementById("STATUS$" + course_index).innerText.trim();
        var units = document.getElementById("DERIVED_REGFRM1_UNT_TAKEN$" + course_index).innerText.trim();
        var grading = document.getElementById("GB_DESCR$" + course_index).innerText.trim();
        var grade = document.getElementById("DERIVED_REGFRM1_CRSE_GRADE_OFF$" + course_index).innerText.trim();

        // Class List
        var class_index = 0;
        var classesInfo = [];
        while (true) {

            var classTr = getClassTr_bycourse_index_andRow(course_index, class_index + 1);//! class index start from 1
            if (classTr == null) {
                break;
            }

            // Class Info
            var classNbr = classTr.querySelector("span[id^='DERIVED_CLS_DTL_CLASS_NBR$']")?.innerText.trim();
            var section = classTr.querySelector("span[id^='MTG_SECTION$']")?.innerText.trim();
            var components = classTr.querySelector("span[id^='MTG_COMP$']")?.innerText.trim();
            var daysTimes = classTr.querySelector("span[id^='MTG_SCHED$']")?.innerText.trim();
            var room = classTr.querySelector("span[id^='MTG_LOC$']")?.innerText.trim().replace(',', '.'); //! room name may contain comma, it will cause error when parsing.
            var instructor_tmp = classTr.querySelector("span[id^='DERIVED_CLS_DTL_SSR_INSTR_LONG$']")?.innerHTML; //! instructor name may contain <br> and &nbsp; tags, use innerHTML to get the full name.
            var instructor = instructor_tmp?.replace(/&nbsp;/g, " ").replace(/,\s*<br>/g, ";").replace(/<span.*?>/g, "").replace(/<\/span>/g, "").trim();
            var startEndDate = classTr.querySelector("span[id^='MTG_DATES$']")?.innerText.trim();

            var classInfo = {
                classNbr: classNbr,
                section: section,
                components: components,
                daysTimes: daysTimes,
                room: room,
                instructor: instructor,
                startEndDate: startEndDate
            };

            classesInfo.push(classInfo);
            class_index++;
        }

        var courseInfo = {
            courseName: courseName,
            status: status,
            units: units,
            grading: grading,
            grade: grade,

            classes: classesInfo
        };

        coursesInfo.push(courseInfo);
    });

    return coursesInfo;
}

// Get course <Div> under <Table>
// ID "win0divDERIVED_REGFRM1_DESCR20$0"
function getCoursesDiv_list() {
    var courseDivs = document.querySelectorAll("div[id^='win0divDERIVED_REGFRM1_DESCR20$']");

    //only one course case
    if (courseDivs.length == 0 && document.querySelector("td.PAGROUPDIVIDER") != null) {
        var parentTable = document.querySelector("table.PSGROUPBOXWBO");
        var courseIndex = parentTable.querySelector("table[id^='ACE_DERIVED_REGFRM1_DESCR20$']").id.split("$")[1];
        var fakeCourseDiv = document.createElement("div");
        fakeCourseDiv.id = "win0divDERIVED_REGFRM1_DESCR20$" + courseIndex;
        fakeCourseDiv.innerHTML = parentTable.outerHTML;
        courseDivs = [fakeCourseDiv];
    }

    return courseDivs;
}

// Get course <Div> under <Table> [deprecated]
// ID "win0divDERIVED_REGFRM1_DESCR20$0"
// function getCoursesDiv_bycourse_index(courseIndex) {
//     return document.getElementById("win0divDERIVED_REGFRM1_DESCR20$" + courseIndex);
// }


// Get class <Tr> under classes <Table>
// ID "trCLASS_MTG_VW$0_row1" (start from 1)
function getClassTr_bycourse_index_andRow(courseIndex, classIndex) {
    //console.log("trCLASS_MTG_VW$" + courseIndex + "_row" + classIndex);
    return document.getElementById("trCLASS_MTG_VW$" + courseIndex + "_row" + classIndex);
}

