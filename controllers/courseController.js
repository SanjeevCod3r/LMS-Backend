import Course from "../models/Course.js";

// get all courses

export const getAllCourse = async (req,res) => {
    try {
        const courses = await Course.find({isPublished: true}).select(['-courseContent','-enrolledStudents']).populate({path: 'educator'})
        
        

        res.json ({success: true, courses})
    } catch (error) {
        res.json({success: false, message:error.message})
    }
}


// get course by id

export const getCourseId = async(req,res)=>{
    const {id} = req.params 
    try {

        const courseData = await Course.findById(id).populate({path:'educator'});

        // Remove lecture Url if previewFrese is false

        courseData.courseContent.forEach(chapter => {
            chapter.chapterContent.forEach(lecture => {
                if(!lecture.isPreviewFree){
                    lecture.lectureUrl = "";
                }
            })
        })

        res.json({success:true, courseData})
        
    } catch (error) {
        res.json({success: false, message:error.message})
    }
}

//update course by id

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) return res.json({ success: false, message: "Course not found" });

    const { courseTitle, courseDescription, coursePrice, discount, courseContent } = req.body;

    if (courseTitle !== undefined) course.courseTitle = courseTitle;
    if (courseDescription !== undefined) course.courseDescription = courseDescription;
    if (coursePrice !== undefined) course.coursePrice = Number(coursePrice);
    if (discount !== undefined) course.discount = Number(discount);
    if (courseContent !== undefined) { course.courseContent = courseContent; 
        course.markModified("courseContent");
    }
    const updatedCourse = await course.save();
    res.json({ success: true, message: "Course updated successfully", course: updatedCourse });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


//delete course by id

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};